/**
 * Stockfish Chess Engine Integration
 *
 * This module provides a wrapper around the Stockfish WASM engine for:
 * - Move analysis and evaluation
 * - Best move calculation
 * - Playing against the computer
 * - Post-game analysis
 */

import type { MoveAnalysis, PositionAnalysis, StockfishSettings } from '@/types/chess';
import { isClient } from './utils';

// Default settings for Stockfish
const DEFAULT_SETTINGS: StockfishSettings = {
  elo: 1500,
  depth: 15,
  multiPv: 3,
  threads: 1,
  hashSize: 16,
};

// Stockfish engine state
interface EngineState {
  worker: Worker | null;
  ready: boolean;
  analyzing: boolean;
  settings: StockfishSettings;
}

// Global engine state
let engineState: EngineState = {
  worker: null,
  ready: false,
  analyzing: false,
  settings: { ...DEFAULT_SETTINGS },
};

// Pending callbacks for async operations
type ResolverFn = (value: any) => void;
let pendingResolvers: Map<string, ResolverFn> = new Map();
let messageId = 0;

/**
 * Initialize the Stockfish engine
 * Must be called before using any engine functions
 */
export async function initEngine(): Promise<boolean> {
  if (!isClient()) {
    return false;
  }

  if (engineState.worker && engineState.ready) {
    return true;
  }

  return new Promise((resolve) => {
    try {
      // Create a new Web Worker for Stockfish
      // We'll use the stockfish.js library from CDN
      const workerCode = `
        let stockfish = null;

        // Load Stockfish from CDN
        importScripts('https://unpkg.com/stockfish@16.0.0/src/stockfish-nnue-16.js');

        // Initialize when Stockfish is ready
        Stockfish().then(sf => {
          stockfish = sf;
          postMessage({ type: 'ready' });

          // Listen for UCI output
          stockfish.addMessageListener(line => {
            postMessage({ type: 'output', data: line });
          });
        });

        // Handle commands from main thread
        onmessage = function(e) {
          if (stockfish && e.data.command) {
            stockfish.postMessage(e.data.command);
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      engineState.worker = new Worker(workerUrl);

      engineState.worker.onmessage = (e) => {
        handleEngineMessage(e.data);
      };

      engineState.worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        engineState.ready = false;
        resolve(false);
      };

      // Wait for ready message
      const checkReady = () => {
        if (engineState.ready) {
          // Initialize UCI and configure engine
          sendCommand('uci');
          sendCommand('setoption name UCI_LimitStrength value true');
          sendCommand(`setoption name UCI_Elo value ${engineState.settings.elo}`);
          sendCommand(`setoption name MultiPV value ${engineState.settings.multiPv}`);
          sendCommand(`setoption name Hash value ${engineState.settings.hashSize}`);
          sendCommand('isready');
          resolve(true);
        } else {
          setTimeout(checkReady, 100);
        }
      };

      setTimeout(checkReady, 100);

      // Cleanup URL
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      resolve(false);
    }
  });
}

/**
 * Handle messages from the Stockfish worker
 */
function handleEngineMessage(message: { type: string; data?: string }) {
  if (message.type === 'ready') {
    engineState.ready = true;
    return;
  }

  if (message.type === 'output' && message.data) {
    const line = message.data;

    // Parse UCI output
    if (line.startsWith('bestmove')) {
      handleBestMove(line);
    } else if (line.startsWith('info')) {
      handleInfo(line);
    } else if (line === 'readyok') {
      engineState.ready = true;
    }
  }
}

// Accumulated analysis info for current search
let currentAnalysis: MoveAnalysis[] = [];

/**
 * Handle 'info' lines from engine (evaluation data)
 */
function handleInfo(line: string) {
  // Parse depth
  const depthMatch = line.match(/depth (\d+)/);
  const depth = depthMatch ? parseInt(depthMatch[1]) : 0;

  // Parse score
  let evaluation = 0;
  let mate: number | undefined;

  const mateMatch = line.match(/score mate (-?\d+)/);
  if (mateMatch) {
    mate = parseInt(mateMatch[1]);
  } else {
    const cpMatch = line.match(/score cp (-?\d+)/);
    if (cpMatch) {
      evaluation = parseInt(cpMatch[1]);
    }
  }

  // Parse PV (principal variation)
  const pvMatch = line.match(/pv (.+)$/);
  const pv = pvMatch ? pvMatch[1].split(' ') : [];

  // Parse MultiPV line number
  const multiPvMatch = line.match(/multipv (\d+)/);
  const multiPvIndex = multiPvMatch ? parseInt(multiPvMatch[1]) - 1 : 0;

  if (pv.length > 0) {
    const analysis: MoveAnalysis = {
      move: pv[0],
      evaluation,
      depth,
      pv,
      mate,
    };

    // Update or add to current analysis
    currentAnalysis[multiPvIndex] = analysis;
  }
}

/**
 * Handle 'bestmove' from engine
 */
function handleBestMove(line: string) {
  const match = line.match(/bestmove (\S+)/);
  const bestMove = match ? match[1] : '';

  // Resolve pending best move request
  const resolver = pendingResolvers.get('bestmove');
  if (resolver) {
    resolver({
      bestMove,
      analysis: [...currentAnalysis],
    });
    pendingResolvers.delete('bestmove');
  }

  currentAnalysis = [];
  engineState.analyzing = false;
}

/**
 * Send a UCI command to the engine
 */
function sendCommand(command: string) {
  if (engineState.worker) {
    engineState.worker.postMessage({ command });
  }
}

/**
 * Update engine settings
 */
export function setEngineSettings(settings: Partial<StockfishSettings>) {
  engineState.settings = { ...engineState.settings, ...settings };

  if (engineState.ready) {
    if (settings.elo !== undefined) {
      sendCommand(`setoption name UCI_Elo value ${settings.elo}`);
    }
    if (settings.multiPv !== undefined) {
      sendCommand(`setoption name MultiPV value ${settings.multiPv}`);
    }
    if (settings.hashSize !== undefined) {
      sendCommand(`setoption name Hash value ${settings.hashSize}`);
    }
  }
}

/**
 * Get the best move for a position
 */
export async function getBestMove(
  fen: string,
  depth?: number
): Promise<{ bestMove: string; analysis: MoveAnalysis[] }> {
  if (!engineState.ready) {
    await initEngine();
  }

  return new Promise((resolve) => {
    pendingResolvers.set('bestmove', resolve);

    currentAnalysis = [];
    engineState.analyzing = true;

    sendCommand(`position fen ${fen}`);
    sendCommand(`go depth ${depth || engineState.settings.depth}`);
  });
}

/**
 * Analyze a position and get evaluation
 */
export async function analyzePosition(
  fen: string,
  depth?: number,
  multiPv?: number
): Promise<PositionAnalysis> {
  if (!engineState.ready) {
    await initEngine();
  }

  // Temporarily set MultiPV if specified
  if (multiPv && multiPv !== engineState.settings.multiPv) {
    sendCommand(`setoption name MultiPV value ${multiPv}`);
  }

  const result = await getBestMove(fen, depth);

  // Restore MultiPV
  if (multiPv && multiPv !== engineState.settings.multiPv) {
    sendCommand(`setoption name MultiPV value ${engineState.settings.multiPv}`);
  }

  const topAnalysis = result.analysis[0] || {
    move: result.bestMove,
    evaluation: 0,
    depth: depth || engineState.settings.depth,
    pv: [result.bestMove],
  };

  return {
    fen,
    evaluation: topAnalysis.evaluation,
    bestMove: result.bestMove,
    depth: topAnalysis.depth,
    pv: topAnalysis.pv,
    mate: topAnalysis.mate,
    topMoves: result.analysis,
  };
}

/**
 * Get the computer's move at the current ELO setting
 */
export async function getComputerMove(fen: string): Promise<string> {
  const result = await getBestMove(fen);
  return result.bestMove;
}

/**
 * Stop the current analysis
 */
export function stopAnalysis() {
  if (engineState.analyzing) {
    sendCommand('stop');
    engineState.analyzing = false;
  }
}

/**
 * Set the engine playing strength (ELO)
 */
export function setElo(elo: number) {
  const clampedElo = Math.max(800, Math.min(3000, elo));
  setEngineSettings({ elo: clampedElo });
}

/**
 * Get current engine settings
 */
export function getEngineSettings(): StockfishSettings {
  return { ...engineState.settings };
}

/**
 * Check if the engine is ready
 */
export function isEngineReady(): boolean {
  return engineState.ready;
}

/**
 * Check if the engine is currently analyzing
 */
export function isAnalyzing(): boolean {
  return engineState.analyzing;
}

/**
 * Terminate the engine worker
 */
export function terminateEngine() {
  if (engineState.worker) {
    engineState.worker.terminate();
    engineState.worker = null;
    engineState.ready = false;
    engineState.analyzing = false;
    pendingResolvers.clear();
    currentAnalysis = [];
  }
}
