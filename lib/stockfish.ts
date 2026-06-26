/**
 * Stockfish Chess Engine Integration
 *
 * Wraps the Stockfish WASM engine (loaded in a Web Worker from a CDN) for move
 * calculation, evaluation, playing, and post-game analysis.
 *
 * Robustness model:
 * - Engine searches are **serialized** through a single-slot mutex, so two
 *   overlapping callers (e.g. auto-analyze + a computer move) never clobber each
 *   other's results or UCI options.
 * - Every search and the init handshake has a **hard timeout**, so a blocked
 *   CDN, a dead worker, or a missing `bestmove` can never leak a pending promise
 *   or hang the UI — callers always get a result (possibly empty) and fall back.
 * - `onerror`/`terminate` settle the in-flight search instead of orphaning it.
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

// Max time to wait for the engine to report ready before giving up.
const INIT_TIMEOUT_MS = 8000;
// Hard backstop for a single search; callers also apply their own (shorter)
// races, so this only bounds pathological hangs.
const SEARCH_TIMEOUT_MS = 8000;

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

interface SearchResult {
  bestMove: string;
  analysis: MoveAnalysis[];
}

// The single in-flight search's settler (set while a `go` is outstanding).
let activeResolver: ((result: SearchResult) => void) | null = null;
// Accumulated analysis info for the current search.
let currentAnalysis: MoveAnalysis[] = [];
// Serializes engine access so only one search runs at a time.
let engineLock: Promise<unknown> = Promise.resolve();
// De-dupes concurrent init calls.
let initPromise: Promise<boolean> | null = null;

/** Run `fn` once the engine is free, then release it for the next caller. */
function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = engineLock.then(fn, fn);
  // Keep the chain alive even if a search rejects (it never should).
  engineLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/**
 * Initialize the Stockfish engine. Idempotent and concurrency-safe: parallel
 * callers share one worker and one init promise. Resolves `false` (never throws)
 * when the engine can't be created or doesn't become ready in time.
 */
export async function initEngine(): Promise<boolean> {
  if (!isClient()) return false;
  if (engineState.worker && engineState.ready) return true;
  if (initPromise) return initPromise;

  initPromise = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
      // Allow a later re-init if this attempt failed.
      if (!ok) initPromise = null;
    };

    try {
      // Web Worker that loads Stockfish 16 (NNUE) from the CDN and relays UCI I/O.
      const workerCode = `
        let stockfish = null;
        try {
          importScripts('https://unpkg.com/stockfish@16.0.0/src/stockfish-nnue-16.js');
          Stockfish().then(function (sf) {
            stockfish = sf;
            postMessage({ type: 'ready' });
            stockfish.addMessageListener(function (line) {
              postMessage({ type: 'output', data: line });
            });
          }).catch(function (err) {
            postMessage({ type: 'error', data: String(err) });
          });
        } catch (err) {
          postMessage({ type: 'error', data: String(err) });
        }
        onmessage = function (e) {
          if (stockfish && e.data && e.data.command) {
            stockfish.postMessage(e.data.command);
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      let urlRevoked = false;
      const revoke = () => {
        if (urlRevoked) return;
        urlRevoked = true;
        URL.revokeObjectURL(workerUrl);
      };

      const worker = new Worker(workerUrl);
      engineState.worker = worker;

      worker.onmessage = (e) => {
        revoke(); // safe to release the blob URL once the worker is running
        const data = e.data as { type?: string; data?: string };
        if (data?.type === 'error') {
          console.error('Stockfish failed to load:', data.data);
          engineState.ready = false;
          finish(false);
          return;
        }
        handleEngineMessage(data);
        if (engineState.ready) {
          // Configure once the engine first reports ready.
          configureEngine();
          finish(true);
        }
      };

      worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        revoke();
        engineState.ready = false;
        // Settle any in-flight search so it doesn't hang.
        settleActiveSearch({ bestMove: '', analysis: [] });
        finish(false);
      };

      // Hard cap: if the worker never reports ready, give up and fall back.
      setTimeout(() => {
        if (!engineState.ready) finish(false);
      }, INIT_TIMEOUT_MS);
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      finish(false);
    }
  });

  return initPromise;
}

/** Send the standard UCI configuration (called once the engine is ready). */
function configureEngine() {
  sendCommand('uci');
  sendCommand('setoption name UCI_LimitStrength value true');
  sendCommand(`setoption name UCI_Elo value ${engineState.settings.elo}`);
  sendCommand(`setoption name MultiPV value ${engineState.settings.multiPv}`);
  sendCommand(`setoption name Hash value ${engineState.settings.hashSize}`);
  sendCommand('isready');
}

/** Resolve the in-flight search (if any) and reset per-search state. */
function settleActiveSearch(result: SearchResult) {
  const resolver = activeResolver;
  activeResolver = null;
  currentAnalysis = [];
  engineState.analyzing = false;
  if (resolver) resolver(result);
}

/** Handle messages from the Stockfish worker. */
function handleEngineMessage(message: { type?: string; data?: string }) {
  if (message.type === 'ready') {
    engineState.ready = true;
    return;
  }

  if (message.type === 'output' && message.data) {
    const line = message.data;
    if (line.startsWith('bestmove')) {
      handleBestMove(line);
    } else if (line.startsWith('info')) {
      handleInfo(line);
    } else if (line === 'readyok') {
      engineState.ready = true;
    }
  }
}

/** Handle 'info' lines from the engine (evaluation data). */
function handleInfo(line: string) {
  const depthMatch = line.match(/depth (\d+)/);
  const depth = depthMatch ? toInt(depthMatch[1], 0) : 0;

  let evaluation = 0;
  let mate: number | undefined;

  const mateMatch = line.match(/score mate (-?\d+)/);
  if (mateMatch) {
    mate = toInt(mateMatch[1], 0);
  } else {
    const cpMatch = line.match(/score cp (-?\d+)/);
    if (cpMatch) evaluation = toInt(cpMatch[1], 0);
  }

  const pvMatch = line.match(/ pv (.+)$/);
  const pv = pvMatch ? pvMatch[1].split(' ').filter(Boolean) : [];

  const multiPvMatch = line.match(/multipv (\d+)/);
  const multiPvIndex = multiPvMatch ? Math.max(0, toInt(multiPvMatch[1], 1) - 1) : 0;

  if (pv.length > 0) {
    currentAnalysis[multiPvIndex] = { move: pv[0], evaluation, depth, pv, mate };
  }
}

/** Handle 'bestmove' from the engine — settles the in-flight search. */
function handleBestMove(line: string) {
  const match = line.match(/bestmove (\S+)/);
  const bestMove = match ? match[1] : '';
  settleActiveSearch({ bestMove, analysis: [...currentAnalysis] });
}

/** Parse an int defensively, returning `fallback` on NaN. */
function toInt(value: string, fallback: number): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Send a UCI command to the engine. */
function sendCommand(command: string) {
  engineState.worker?.postMessage({ command });
}

/** Update engine settings (and apply live ones if ready). */
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
 * Core search primitive — serialized and timeout-bounded. Optionally sets a
 * temporary MultiPV for the duration of the search (restored afterwards).
 */
function search(fen: string, opts: { depth?: number; multiPv?: number }): Promise<SearchResult> {
  return runExclusive(
    () =>
      new Promise<SearchResult>((resolve) => {
        if (!engineState.ready || !engineState.worker) {
          resolve({ bestMove: '', analysis: [] });
          return;
        }

        const tempMultiPv = opts.multiPv != null && opts.multiPv !== engineState.settings.multiPv;
        let timer: ReturnType<typeof setTimeout>;

        // Wrap settle so we restore MultiPV and clear the timeout exactly once.
        activeResolver = (result: SearchResult) => {
          clearTimeout(timer);
          if (tempMultiPv) {
            sendCommand(`setoption name MultiPV value ${engineState.settings.multiPv}`);
          }
          resolve(result);
        };

        currentAnalysis = [];
        engineState.analyzing = true;

        if (tempMultiPv) {
          sendCommand(`setoption name MultiPV value ${opts.multiPv}`);
        }
        sendCommand(`position fen ${fen}`);
        sendCommand(`go depth ${opts.depth || engineState.settings.depth}`);

        // Backstop: force a stop and settle with whatever we have.
        timer = setTimeout(() => {
          sendCommand('stop');
          const best = currentAnalysis[0]?.move ?? '';
          settleActiveSearch({ bestMove: best, analysis: [...currentAnalysis] });
        }, SEARCH_TIMEOUT_MS);
      })
  );
}

/** Get the best move for a position. Resolves `{ bestMove: '' }` on failure. */
export async function getBestMove(
  fen: string,
  depth?: number
): Promise<{ bestMove: string; analysis: MoveAnalysis[] }> {
  if (!engineState.ready) await initEngine();
  return search(fen, { depth });
}

/** Analyze a position and return a structured evaluation. */
export async function analyzePosition(
  fen: string,
  depth?: number,
  multiPv?: number
): Promise<PositionAnalysis> {
  if (!engineState.ready) await initEngine();

  const result = await search(fen, { depth, multiPv });

  const topAnalysis = result.analysis[0] || {
    move: result.bestMove,
    evaluation: 0,
    depth: depth || engineState.settings.depth,
    pv: result.bestMove ? [result.bestMove] : [],
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

/** Get the computer's move at the current ELO setting. */
export async function getComputerMove(fen: string): Promise<string> {
  const result = await getBestMove(fen);
  return result.bestMove;
}

/** Stop the current analysis. */
export function stopAnalysis() {
  if (engineState.analyzing) {
    sendCommand('stop');
    engineState.analyzing = false;
  }
}

/** Set the engine playing strength (ELO). */
export function setElo(elo: number) {
  const safeElo = Number.isFinite(elo) ? elo : DEFAULT_SETTINGS.elo;
  const clampedElo = Math.max(800, Math.min(3000, Math.round(safeElo)));
  setEngineSettings({ elo: clampedElo });
}

/**
 * Toggle UCI_LimitStrength. The engine is normally capped to `computerElo` for
 * *playing*; analysis must run at full strength to produce trustworthy evals.
 * Disabling the limit removes the cap; re-enabling it restores the configured
 * ELO (UCI_Elo only takes effect while LimitStrength is on).
 */
export function setLimitStrength(enabled: boolean) {
  if (!engineState.ready) return;
  sendCommand(`setoption name UCI_LimitStrength value ${enabled ? 'true' : 'false'}`);
  if (enabled) {
    sendCommand(`setoption name UCI_Elo value ${engineState.settings.elo}`);
  }
}

/** Get current engine settings. */
export function getEngineSettings(): StockfishSettings {
  return { ...engineState.settings };
}

/** Check if the engine is ready. */
export function isEngineReady(): boolean {
  return engineState.ready;
}

/** Check if the engine is currently analyzing. */
export function isAnalyzing(): boolean {
  return engineState.analyzing;
}

/** Terminate the engine worker and settle any in-flight search. */
export function terminateEngine() {
  if (engineState.worker) {
    engineState.worker.terminate();
    engineState.worker = null;
    engineState.ready = false;
    engineState.analyzing = false;
    initPromise = null;
    settleActiveSearch({ bestMove: '', analysis: [] });
  }
}
