#!/usr/bin/env node
/**
 * Copies the bundled Stockfish 18 lite-single engine from node_modules into
 * /public/engine/ so it's served same-origin at runtime. Same-origin loading
 * sidesteps the CORP requirement that COEP `require-corp` imposes on
 * cross-origin subresources, removes the CDN supply-chain dependency, and
 * makes first-move latency a same-origin browser cache lookup.
 *
 * Wired into both `postinstall` (so dev works after `npm i`) and `build` (so
 * Vercel always has the files). Idempotent — only copies when the source is
 * newer than the destination.
 *
 * The engine files themselves are NOT committed (see .gitignore) — they're
 * regenerated from the `stockfish` npm package on every install.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const FILES = [
  // 21KB JS loader — also acts as the Worker entry point via #,worker hash.
  'stockfish-18-lite-single.js',
  // 7MB WebAssembly binary, fetched by the loader at runtime.
  'stockfish-18-lite-single.wasm',
];

const SRC_DIR = path.join(projectRoot, 'node_modules', 'stockfish', 'bin');
const DEST_DIR = path.join(projectRoot, 'public', 'engine');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyIfStale(src, dest) {
  if (!(await exists(src))) {
    throw new Error(`Missing engine source: ${src}`);
  }
  const srcStat = await fs.stat(src);
  if (await exists(dest)) {
    const destStat = await fs.stat(dest);
    if (destStat.size === srcStat.size && destStat.mtimeMs >= srcStat.mtimeMs) {
      return false; // up to date
    }
  }
  await fs.copyFile(src, dest);
  return true;
}

async function main() {
  // Skip silently when the source dir isn't there — happens on `npm install`
  // for a fresh `prisma generate` or other postinstall steps when an old
  // node_modules is missing. The dev/build path will retry later.
  if (!(await exists(SRC_DIR))) {
    console.warn(`[setup-engine] ${SRC_DIR} not found — skipping (run after npm install).`);
    return;
  }

  await fs.mkdir(DEST_DIR, { recursive: true });

  let copied = 0;
  for (const name of FILES) {
    const src = path.join(SRC_DIR, name);
    const dest = path.join(DEST_DIR, name);
    if (await copyIfStale(src, dest)) {
      copied++;
      console.log(`[setup-engine] copied ${name}`);
    }
  }

  if (copied === 0) {
    console.log('[setup-engine] engine already up to date.');
  } else {
    console.log(`[setup-engine] ${copied} file(s) refreshed in /public/engine/.`);
  }
}

main().catch((err) => {
  console.error('[setup-engine] failed:', err);
  process.exit(1);
});
