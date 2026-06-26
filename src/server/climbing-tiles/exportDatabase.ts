import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { getDb } from '../db/db';

const EXPORT_DIR = path.resolve(process.cwd(), 'data/exports');
const FILE_PREFIX = 'openclimbing_';
const FILE_SUFFIX = '.sqlite';

const MAX_AGE_MS = 5 * 60 * 1000; // regenerate only if the newest export is older than 5 minutes
const KEEP_FILES = 3; // keep only the last 3 exports, delete the rest

// only filenames we produce ourselves – also guards the download route against path traversal
export const EXPORT_FILE_REGEX = /^openclimbing_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{6}\.sqlite$/;

type ExportFile = { name: string; path: string; mtimeMs: number };

const listExportFiles = (): ExportFile[] => {
  if (!existsSync(EXPORT_DIR)) {
    return [];
  }
  return readdirSync(EXPORT_DIR)
    .filter((name) => EXPORT_FILE_REGEX.test(name))
    .map((name) => {
      const filePath = path.join(EXPORT_DIR, name);
      return { name, path: filePath, mtimeMs: statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs); // newest first
};

const pruneOldExports = () => {
  for (const file of listExportFiles().slice(KEEP_FILES)) {
    unlinkSync(file.path);
  }
};

const createExport = async (): Promise<string> => {
  mkdirSync(EXPORT_DIR, { recursive: true });
  const fileName = `${FILE_PREFIX}${format(new Date(), 'yyyy-MM-dd_HHmmss')}${FILE_SUFFIX}`;

  // Online backup – produces one consistent .sqlite file with all WAL data merged in,
  // so we don't have to deal with the separate -wal / -shm files.
  await getDb().backup(path.join(EXPORT_DIR, fileName));

  pruneOldExports();
  return fileName;
};

/**
 * Returns the filename of a fresh-enough export, creating a new one if the latest
 * export is missing or older than 5 minutes. Keeps only the last 3 files on disk.
 */
export const getOrCreateExport = async (): Promise<string> => {
  const [newest] = listExportFiles();
  if (newest && Date.now() - newest.mtimeMs < MAX_AGE_MS) {
    return newest.name;
  }
  return createExport();
};

/**
 * Resolves a requested filename to an existing export path, or null if the name is
 * invalid (path traversal, unknown pattern) or the file doesn't exist.
 */
export const getExportFilePath = (fileName: string): string | null => {
  if (!EXPORT_FILE_REGEX.test(fileName)) {
    return null;
  }
  const filePath = path.join(EXPORT_DIR, fileName);
  if (path.dirname(filePath) !== EXPORT_DIR || !existsSync(filePath)) {
    return null;
  }
  return filePath;
};
