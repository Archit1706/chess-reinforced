/**
 * Stockfish Chess Engine Integration
 *
 * Loads Stockfish 18 (lite-single, ~7MB) bundled in /public/engine/, spawned
 * directly as a Web Worker. Same-origin loading: no CDN dependency, no COEP
 * cross-origin headache, browser caches the WASM once and forever.
 *
 * The build/postinstall hook `scripts/setup-engine.mjs` copies the engine
 * files from `node_modules/stockfish/bin/` into `/public/engine/` on every
 * install — they're not committed to git.
 *
 * Robustness:
 * - Searches are serialized through a single in-flight slot so overlapping
 *   callers (auto-analyze vs computer move) can't clobber each other.
 * - Init handshake + every search has a hard timeout, so a blocked worker
 *   never leaks a pending promise. Callers always get a result and fall back
 *   to the pure-JS engine in `lib/local-engine.ts` if Stockfish failed.
 * - onerror/terminate settle the in-flight search instead of orphaning it.
 */

import type { MoveAnalysis, PositionAnalysis, StockfishSettings } from '@/types/chess';
import { isClient } from './utils';

// Same-origin worker path. Hash params: `<wasm-filename>,worker` — the loader
// reads them off self.location.hash to (a) locate the WASM beside itself and
// (b) switch into worker mode (self-initialize + listen for UCI commands).
const ENGINE_WORKER_URL =
  '/engine/stockfish-18-lite-single.js#stockfish-18-lite-single.wasm,worker';

// Default settings for Stockfish.
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

interface EngineState {
  worker: Worker | null;
  ready: boolean;
  analyzing: boolean;
  settings: StockfishSettings;
}

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
  engineLock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/**
 * Initialize the Stockfish engine. Idempotent and concurrency-safe: parallel
 * callers share one worker and one init promise. Resolves `false` (never
 * throws) when the engine can't be created or doesn't become ready in time —
 * callers fall back to the local pure-JS engine.
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
      if (!ok) initPromise = null;
    };

    try {
      const worker = new Worker(ENGINE_WORKER_URL);
      engineState.worker = worker;

      worker.onmessage = (e) => {
        handleEngineMessage(e.data);
        // The engine is ready once it answers our `isready` ping with `readyok`.
        if (engineState.ready && !settled) finish(true);
      };

      worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        engineState.ready = false;
        // Settle any in-flight search so it doesn't hang.
        settleActiveSearch({ bestMove: '', analysis: [] });
        finish(false);
      };

      // Kick off the UCI handshake. `readyok` from the engine flips `ready`.
      configureEngine();

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

/** Send the standard UCI configuration (idempotent). */
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

/**
 * Handle a raw UCI message from the engine worker. The lite-single engine
 * communicates as plain text strings (one UCI line per message).
 */
function handleEngineMessage(line: unknown) {
  if (typeof line !== 'string') return;
  if (line.startsWith('bestmove')) {
    handleBestMove(line);
  } else if (line.startsWith('info')) {
    handleInfo(line);
  } else if (line === 'readyok' || line === 'uciok') {
    engineState.ready = true;
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

/**
 * Send a raw UCI command string to the engine worker. The lite-single engine
 * treats `e.data` as the command text directly (no envelope).
 */
function sendCommand(command: string) {
  engineState.worker?.postMessage(command);
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
