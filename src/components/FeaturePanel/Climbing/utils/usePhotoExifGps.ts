import { useEffect, useState } from 'react';
import { addFilePrefix } from './photo';

export type PhotoExifs = Record<string, Record<string, any>>;

export type PhotoGps = {
  lng: number;
  lat: number;
  azimuth: number | null;
  /** horizontal field of view in degrees, derived from focal length, or null */
  fov: number | null;
};

const parseFractionOrNumber = (input: string): number => {
  if (input.includes('/')) {
    const [numerator, denominator] = input.split('/');
    return parseFloat(numerator) / parseFloat(denominator);
  }
  return parseFloat(input);
};

// 35mm full frame is 36mm wide; horizontal FOV = 2·atan(36 / (2·f)).
const FULL_FRAME_WIDTH_MM = 36;

const getHorizontalFov = (exifItems: Record<string, any>): number | null => {
  const raw =
    exifItems.FocalLengthIn35mmFilm ?? exifItems.FocalLengthIn35mmFormat;
  if (raw == null) return null;
  const focalLength35 = parseFractionOrNumber(String(raw));
  if (!Number.isFinite(focalLength35) || focalLength35 <= 0) return null;
  const fovRad = 2 * Math.atan(FULL_FRAME_WIDTH_MM / (2 * focalLength35));
  return (fovRad * 180) / Math.PI;
};

/**
 * Reads the GPS position (and optional compass direction) a photo was taken
 * from out of its Wikimedia Commons EXIF metadata. Returns `null` when the
 * photo has no usable coordinates.
 */
export const getPhotoGps = (
  exifItems: Record<string, any> | undefined,
): PhotoGps | null => {
  if (!exifItems || !exifItems.GPSLongitude || !exifItems.GPSLatitude) {
    return null;
  }
  const lng = Number(exifItems.GPSLongitude);
  const lat = Number(exifItems.GPSLatitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }
  return {
    lng,
    lat,
    azimuth: exifItems.GPSImgDirection
      ? parseFractionOrNumber(exifItems.GPSImgDirection)
      : null,
    fov: getHorizontalFov(exifItems),
  };
};

/**
 * Fetches EXIF metadata for a list of Wikimedia Commons photo file names
 * (without the `File:` prefix). Keys of the returned object are the canonical
 * Commons titles (e.g. `File:Foo.jpg`).
 */
export const useGetPhotoExifs = (photoPaths: Array<string>): PhotoExifs => {
  const [photoExifs, setPhotoExifs] = useState<PhotoExifs>({});

  // join the paths so the effect only re-runs when the actual set changes,
  // not on every new array identity coming from the caller.
  const photoPathsKey = (photoPaths ?? []).join('|');

  useEffect(() => {
    const photos = photoPathsKey ? photoPathsKey.split('|') : [];
    if (photos.length === 0) {
      setPhotoExifs({});
      return;
    }

    let aborted = false;
    const encodedTitles = photos.map((name) => addFilePrefix(name)).join('|');
    const url = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=metadata&titles=${encodedTitles}&format=json&origin=*`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (aborted) return;
        const pages = data?.query?.pages ?? {};
        const result = Object.values(pages).reduce<PhotoExifs>(
          (acc, item: any) => {
            const metadata = item?.imageinfo?.[0]?.metadata?.reduce(
              (acc2, { name, value }) => ({ ...acc2, [name]: value }),
              {},
            );
            return { ...acc, [item.title]: metadata };
          },
          {},
        );
        setPhotoExifs(result);
      })
      .catch(() => {
        if (!aborted) setPhotoExifs({});
      });

    return () => {
      aborted = true;
    };
  }, [photoPathsKey]);

  return photoExifs;
};
