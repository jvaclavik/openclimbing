import { Feature, LonLat } from '../../types';
import { WikimediaCommonsUser } from '../auth/session';
import { uploadFile, UploadProgressEvent } from '../api';
import { extractExifData } from './exif';
import { convertHeicToJpeg, isHeicFile } from './heic';
import { buildUploadWikitext, LicenseId } from './wikitext';
import {
  buildSuggestedFilenameParts,
  FilenameParts,
  findAvailableFilename,
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
  const finalFilename = await findAvailableFilename({
    stem: filenameStem,
    ext: prepared.filenameParts.ext,
  });
  const text = buildUploadWikitext({
    feature,
    user,
    description,
    categories,
    license,
    date: prepared.exifDate,
    photoLocation: prepared.exifLocation,
  });

  const result = await uploadFile({
    file: prepared.file,
    filename: finalFilename,
    text,
    comment:
      `Uploaded from OpenClimbing.org for ${feature.tags?.name ?? ''}`.trim(),
    onProgress,
  });

  const returnedFilename = result.upload?.filename ?? finalFilename;
  // Commons returns underscores in filenames; normalize back to spaces for the OSM tag.
  const normalized = returnedFilename.replace(/_/g, ' ');
  return {
    fileTagValue: `File:${normalized}`,
    descriptionUrl: result.upload?.imageinfo?.descriptionurl,
  };
};
