import exifr from 'exifr';
import { LonLat } from '../../types';

export type ExifData = {
  location: LonLat | null;
  date: Date | null;
};

export const extractExifData = async (file: Blob): Promise<ExifData> => {
  try {
    const exif = await exifr.parse(file as unknown as ArrayBuffer);
    const location =
      exif?.latitude && exif?.longitude
        ? ([exif.longitude, exif.latitude] as LonLat)
        : null;
    const date = exif?.DateTimeOriginal
      ? new Date(exif.DateTimeOriginal)
      : null;
    return { location, date };
  } catch {
    return { location: null, date: null };
  }
};
