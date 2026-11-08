import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  loadClimbSlugs,
  readViaFerrataRatings,
} from '../src/server/tours/viaFerrata.ts';

const OUT_DIR = path.resolve('data/via-ferrata-scan');
const OUT_FILE = path.join(OUT_DIR, 'climbs.jsonl');
const SUMMARY_FILE = path.join(OUT_DIR, 'summary.json');
const CONCURRENCY = 3;
const GAP_MS = 250;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const readDoneSlugs = async () => {
  try {
    const text = await readFile(OUT_FILE, 'utf8');
    const slugs = new Set<string>();
    text.split('\n').forEach((line) => {
      if (!line.trim()) return;
      const row = JSON.parse(line) as { slug?: string };
      if (row.slug) slugs.add(row.slug);
    });
    return slugs;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    )
      return new Set<string>();
    throw error;
  }
};

const writeLine = (stream: ReturnType<typeof createWriteStream>, line: string) =>
  new Promise<void>((resolve, reject) => {
    const ok = stream.write(`${line}\n`, (error) => {
      if (error) reject(error);
    });
    if (ok) resolve();
    else stream.once('drain', () => resolve());
  });

const slugs = await loadClimbSlugs();
await mkdir(OUT_DIR, { recursive: true });
const done = await readDoneSlugs();
const pending = slugs.filter((slug) => !done.has(slug));
const stream = createWriteStream(OUT_FILE, { flags: 'a' });

let cursor = 0;
let okCount = 0;
let failCount = 0;

const worker = async () => {
  while (cursor < pending.length) {
    const index = cursor;
    cursor += 1;
    const slug = pending[index];
    if (!slug) continue;
    const started = Date.now();
    try {
      const ratings = await readViaFerrataRatings(slug);
      if (!ratings) {
        failCount += 1;
        await writeLine(
          stream,
          JSON.stringify({ slug, ok: false, error: 'Seite ohne lesbare Angaben' }),
        );
      } else {
        okCount += 1;
        await writeLine(
          stream,
          JSON.stringify({
            ok: true,
            fetchedAt: new Date().toISOString(),
            ...ratings,
          }),
        );
      }
    } catch (error) {
      failCount += 1;
      const message = error instanceof Error ? error.message : 'Abruf fehlgeschlagen';
      await writeLine(stream, JSON.stringify({ slug, ok: false, error: message }));
      if (/429|503|502/.test(message)) await sleep(8000);
    }
    const finished = okCount + failCount;
    if (finished % 25 === 0 || finished === pending.length) {
      console.log(
        `${finished}/${pending.length} gelesen, ${okCount} vollständig, ${failCount} leer oder Fehler`,
      );
    }
    const elapsed = Date.now() - started;
    if (elapsed < GAP_MS) await sleep(GAP_MS - elapsed);
  }
};

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
await new Promise<void>((resolve) => {
  stream.end(() => resolve());
});

const summary = {
  directory: slugs.length,
  previouslySaved: done.size,
  attempted: pending.length,
  read: okCount,
  failed: failCount,
  file: OUT_FILE,
};
await writeFile(SUMMARY_FILE, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
