import { Feature } from '../../types';
import { isTitleAvailable } from '../api';

const sanitizeForCommons = (raw: string): string =>
  raw
    .replace(/[#<>[\]|{}/\\:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const getCragAreaTitle = (feature: Feature): string | null => {
  const cragName = feature.tags?.name;
  if (!cragName) return null;
  const areaParent = feature.parentFeatures?.find(
    (parent) => parent.tags?.climbing === 'area' && parent.tags?.name,
  );
  const area = areaParent?.tags?.name;
  return area ? `${area} - ${cragName}` : cragName;
};

const splitExtension = (filename: string): { stem: string; ext: string } => {
  const idx = filename.lastIndexOf('.');
  if (idx <= 0) return { stem: filename, ext: '' };
  return {
    stem: filename.slice(0, idx),
    ext: filename.slice(idx + 1).toLowerCase(),
  };
};

export type FilenameParts = {
  /** User-editable name without extension */
  stem: string;
  /** Extension determined by the (post-conversion) file, without leading dot */
  ext: string;
};

const normalizeExtension = (rawExt: string, fileType: string): string => {
  const ext = rawExt.toLowerCase();
  if (ext === 'heic' || ext === 'heif') return 'jpg';
  if (ext) return ext;
  if (fileType.startsWith('image/')) return fileType.slice(6);
  return 'jpg';
};

export const buildSuggestedFilenameParts = (
  feature: Feature,
  fileForUpload: File,
): FilenameParts => {
  const baseTitle = getCragAreaTitle(feature);
  const fallback = feature.tags?.name || 'Crag';
  const stem = sanitizeForCommons(baseTitle ?? fallback);
  const { ext } = splitExtension(fileForUpload.name);
  return { stem, ext: normalizeExtension(ext, fileForUpload.type) };
};

export const composeFilename = ({ stem, ext }: FilenameParts): string =>
  `${stem.trim()}.${ext}`;

export const MAX_FILENAME_ATTEMPTS = 30;

/** Numbered filename variant: index 0 is the plain name, 1 → "(2)", 2 → "(3)"… */
export const withSuffix = (parts: FilenameParts, n: number): string => {
  if (n === 0) return composeFilename(parts);
  return composeFilename({ stem: `${parts.stem} (${n + 1})`, ext: parts.ext });
};

export type AvailableFilename = { filename: string; index: number };

/**
 * Finds the first numbered filename variant whose exact title is free on
 * Commons, starting at `startIndex`. Returns the chosen index so callers can
 * resume the search past it if the upload itself later reports a collision
 * (e.g. `exists-normalized`, which the exact-title check can't detect upfront).
 */
export const findAvailableFilename = async (
  parts: FilenameParts,
  startIndex = 0,
): Promise<AvailableFilename> => {
  for (let n = startIndex; n < MAX_FILENAME_ATTEMPTS; n++) {
    const candidate = withSuffix(parts, n);
    if (await isTitleAvailable(`File:${candidate}`)) {
      return { filename: candidate, index: n };
    }
  }
  throw new Error(
    `Could not find available filename based on ${composeFilename(parts)}`,
  );
};
