import { Feature, LonLat } from '../../types';
import { WikimediaCommonsUser } from '../auth/session';
import {
  CommonsUploadWarningError,
  uploadFile,
  UploadProgressEvent,
} from '../api';
import { extractExifData } from './exif';
import { convertHeicToJpeg, isHeicFile } from './heic';
import { buildUploadWikitext, LicenseId } from './wikitext';
import {
  buildSuggestedFilenameParts,
  FilenameParts,
  findAvailableFilename,
  MAX_FILENAME_ATTEMPTS,
} from './filename';

export type PreparedUpload = {
  file: File;
  exifDate: Date | null;
  exifLocation: LonLat | null;
  /** Suggested filename parts (stem editable, ext fixed) */
  filenameParts: FilenameParts;
};

export const preparePhotoForUpload = async (
  rawFile: File,
  feature: Feature,
): Promise<PreparedUpload> => {
  // Read EXIF from the raw file first; HEIC conversion drops EXIF in heic2any.
  const exif = await extractExifData(rawFile);
  const file = isHeicFile(rawFile) ? await convertHeicToJpeg(rawFile) : rawFile;
  return {
    file,
    exifDate: exif.date,
    exifLocation: exif.location,
    filenameParts: buildSuggestedFilenameParts(feature, file),
  };
};

type UploadPhotoArgs = {
  prepared: PreparedUpload;
  filenameStem: string;
  feature: Feature;
  user: WikimediaCommonsUser;
  description: string;
  categories: string[];
  license: LicenseId;
  onProgress?: (progress: UploadProgressEvent) => void;
};

export type UploadPhotoResult = {
  /** Canonical title without "File:" prefix, ready to be saved as wikimedia_commons tag value */
  fileTagValue: string;
  /** Full descriptionurl returned by Commons */
  descriptionUrl?: string;
};

export const uploadPhotoToCommons = async ({
  prepared,
  filenameStem,
  feature,
  user,
  description,
  categories,
  license,
  onProgress,
}: UploadPhotoArgs): Promise<UploadPhotoResult> => {
  const parts: FilenameParts = {
    stem: filenameStem,
    ext: prepared.filenameParts.ext,
  };
  const text = buildUploadWikitext({
    feature,
    user,
    description,
    categories,
    license,
    date: prepared.exifDate,
    photoLocation: prepared.exifLocation,
  });
  const comment =
    `Uploaded from OpenClimbing.org for ${feature.tags?.name ?? ''}`.trim();

  // The exact-title availability check can't detect normalized collisions
  // (`exists-normalized`), so the upload may still clash. When it does, bump the
  // numeric suffix and retry with the next free name instead of failing.
  let startIndex = 0;
  for (let attempt = 0; attempt < MAX_FILENAME_ATTEMPTS; attempt++) {
    const { filename, index } = await findAvailableFilename(parts, startIndex);
    try {
      const result = await uploadFile({
        file: prepared.file,
        filename,
        text,
        comment,
        onProgress,
      });

      const returnedFilename = result.upload?.filename ?? filename;
      // Commons returns underscores in filenames; normalize back to spaces for the OSM tag.
      const normalized = returnedFilename.replace(/_/g, ' ');
      return {
        fileTagValue: `File:${normalized}`,
        descriptionUrl: result.upload?.imageinfo?.descriptionurl,
      };
    } catch (e) {
      if (e instanceof CommonsUploadWarningError && e.isFilenameCollision) {
        startIndex = index + 1;
        continue;
      }
      throw e;
    }
  }

  throw new Error(
    `Could not upload photo: too many filename collisions for "${filenameStem}"`,
  );
};
