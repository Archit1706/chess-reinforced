/**
 * Streaming importer for the Lichess puzzle database.
 *
 * Designed to scale from the bundled 800-row sample up to the full multi-
 * million-row dump with flat memory use:
 *   - reads line by line (never loads the file into memory)
 *   - parses/normalizes each row, skipping malformed ones (fault tolerant)
 *   - inserts in batched transactions with `skipDuplicates` (idempotent /
 *     re-runnable, keyed on the Lichess PuzzleId)
 *
 * Usage (npm run db:import-puzzles -- [options]):
 *   (no args)                 import the bundled sample (prisma/data/puzzles.sample.csv)
 *   --file <path>             import a .csv, .csv.gz, or .csv.zst file
 *   --stdin                   read CSV from stdin, e.g.
 *                               zstdcat lichess_db_puzzle.csv.zst | npm run db:import-puzzles -- --stdin
 *   --limit <n>               stop after importing n puzzles
 *   --batch <n>               rows per transaction (default 1000)
 *   --min-rating <n>          skip puzzles below this rating
 *   --max-rating <n>          skip puzzles above this rating
 *   --reset                   delete existing puzzles first
 *
 * Note on .zst: Node's built-in zstd decoder does not handle the dump's frame
 * layout reliably, so prefer piping through `zstdcat` into `--stdin`. A direct
 * `--file *.zst` is attempted as a best effort and will error clearly if it
 * decodes nothing.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { PrismaClient } from '@prisma/client';
import { parseLichessCsvRow, serializeThemes } from '../lib/puzzles/lichess';
import type { NormalizedPuzzle } from '../lib/puzzles/types';

const prisma = new PrismaClient();

const DEFAULT_SAMPLE = path.join(__dirname, 'data', 'puzzles.sample.csv');

export interface ImportOptions {
  /** File path; ignored when `stdin` is true. Defaults to the bundled sample. */
  file?: string;
  stdin?: boolean;
  limit?: number;
  batchSize?: number;
  minRating?: number;
  maxRating?: number;
  reset?: boolean;
  /** Log progress to stderr (default true for CLI, false when embedded). */
  log?: boolean;
}

export interface ImportResult {
  parsed: number;
  skipped: number;
  inserted: number;
}

function resolveInput(opts: ImportOptions): NodeJS.ReadableStream {
  if (opts.stdin) return process.stdin;

  const file = opts.file ?? DEFAULT_SAMPLE;
  if (!fs.existsSync(file)) {
    throw new Error(`Input file not found: ${file}`);
  }
  const raw = fs.createReadStream(file);
  if (file.endsWith('.gz')) return raw.pipe(zlib.createGunzip());
  if (file.endsWith('.zst')) {
    // Best effort; see the note at the top of this file.
    const dec = zlib.createZstdDecompress({
      params: { [zlib.constants.ZSTD_d_windowLogMax]: 31 },
    });
    return raw.pipe(dec);
  }
  return raw;
}

/**
 * Core import routine. Consumes a stream of CSV lines and writes batched,
 * de-duplicated rows to the database.
 */
export async function importFromStream(
  input: NodeJS.ReadableStream,
  opts: ImportOptions = {}
): Promise<ImportResult> {
  const batchSize = opts.batchSize ?? 1000;
  const log = opts.log ?? true;
  const result: ImportResult = { parsed: 0, skipped: 0, inserted: 0 };

  if (opts.reset) {
    // Order matters: drop child rows referencing Puzzle first, otherwise the
    // final delete fails (no ON DELETE CASCADE declared in the schema).
    await prisma.puzzleReview.deleteMany({});
    await prisma.puzzleAttempt.deleteMany({});
    await prisma.puzzle.deleteMany({});
    if (log) console.error('Cleared existing puzzles.');
  }

  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  let batch: NormalizedPuzzle[] = [];

  const flush = async () => {
    if (batch.length === 0) return;
    // Batched upserts in a single transaction. SQLite doesn't support
    // `createMany({ skipDuplicates })`, and upsert keeps the import idempotent
    // (safe to re-run, refreshes changed rows) keyed on the Lichess PuzzleId.
    await prisma.$transaction(
      batch.map((p) => {
        const data = {
          fen: p.fen,
          moves: p.moves.join(' '),
          themes: serializeThemes(p.themes),
          rating: p.rating,
        };
        return prisma.puzzle.upsert({
          where: { id: p.id },
          create: { id: p.id, ...data },
          update: data,
        });
      })
    );
    result.inserted += batch.length;
    batch = [];
    if (log) {
      process.stderr.write(
        `\r  parsed=${result.parsed} inserted=${result.inserted} skipped=${result.skipped}`
      );
    }
  };

  for await (const line of rl) {
    const puzzle = parseLichessCsvRow(line);
    if (!puzzle) {
      // Blank lines and the header are expected; don't count them as data.
      if (line.trim() && !line.startsWith('PuzzleId,')) result.skipped++;
      continue;
    }
    if (opts.minRating != null && puzzle.rating < opts.minRating) {
      result.skipped++;
      continue;
    }
    if (opts.maxRating != null && puzzle.rating > opts.maxRating) {
      result.skipped++;
      continue;
    }

    result.parsed++;
    batch.push(puzzle);
    if (batch.length >= batchSize) await flush();
    if (opts.limit != null && result.parsed >= opts.limit) break;
  }
  await flush();
  if (log) process.stderr.write('\n');

  return result;
}

/** Resolve options to an input stream and run the import. */
export async function importPuzzles(opts: ImportOptions = {}): Promise<ImportResult> {
  const input = resolveInput(opts);
  return importFromStream(input, opts);
}

function parseArgs(argv: string[]): ImportOptions {
  const opts: ImportOptions = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case '--stdin': opts.stdin = true; break;
      case '--reset': opts.reset = true; break;
      case '--file': opts.file = next(); break;
      case '--limit': opts.limit = Number.parseInt(next(), 10); break;
      case '--batch': opts.batchSize = Number.parseInt(next(), 10); break;
      case '--min-rating': opts.minRating = Number.parseInt(next(), 10); break;
      case '--max-rating': opts.maxRating = Number.parseInt(next(), 10); break;
      default:
        if (!arg.startsWith('--') && !opts.file) opts.file = arg;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const source = opts.stdin ? 'stdin' : opts.file ?? DEFAULT_SAMPLE;
  console.error(`Importing puzzles from ${source} ...`);

  const result = await importPuzzles(opts);

  if (result.parsed === 0) {
    console.error(
      'No puzzles were parsed. If reading a .zst file directly, pipe it instead:\n' +
        '  zstdcat lichess_db_puzzle.csv.zst | npm run db:import-puzzles -- --stdin'
    );
    process.exitCode = 1;
  }
  console.error(
    `Done. parsed=${result.parsed} inserted=${result.inserted} skipped=${result.skipped}`
  );
}

// Run only when invoked directly (not when imported by the seed script).
if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
