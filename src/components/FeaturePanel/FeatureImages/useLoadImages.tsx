import { useEffect, useMemo, useState } from 'react';
import {
  getImageDefId,
  getInstantImage,
  ImageType,
} from '../../../services/images/getImageDefs';
import {
  getWikimediaCommonsFileName,
  getWikimediaThumbWidth,
} from '../../../services/images/getCommonsImageUrl';
import { not, publishDbgObject } from '../../../utils';
import { getImageFromApi } from '../../../services/images/getImageFromApi';
import { useFeatureContext } from '../../utils/FeatureContext';
import { ImageDef, isInstant } from '../../../services/types';
import uniqBy from 'lodash/uniqBy';

type ImageWithDef = { def: ImageDef; image: ImageType };
export type ImagesType = ImageWithDef[];

const betterWikimediaImg = (imageA: ImageWithDef, imageB: ImageWithDef) => {
  const fileA = getWikimediaCommonsFileName(imageA.image.imageUrl);
  const fileB = getWikimediaCommonsFileName(imageB.image.imageUrl);
  if (!fileA || fileA !== fileB) {
    return null;
  }

  const pxA = getWikimediaThumbWidth(imageA.image.imageUrl) ?? 0;
  const pxB = getWikimediaThumbWidth(imageB.image.imageUrl) ?? 0;
  const preferred = pxA >= pxB ? imageA : imageB;
  const unpreferred = pxA >= pxB ? imageB : imageA;

  return { preferred, unpreferred };
};

const mergeTwoImages = (
  imageA: ImageWithDef,
  imageB: ImageWithDef,
): ImageWithDef | null => {
  const mergingData =
    imageA.image.imageUrl === imageB.image.imageUrl
      ? { preferred: imageA, unpreferred: imageB }
      : betterWikimediaImg(imageA, imageB);

  if (!mergingData) {
    return null;
  }

  const { preferred, unpreferred } = mergingData;
  return {
    ...preferred,
    image: {
      ...preferred.image,
      sameUrlResolvedAlsoFrom: uniqBy(
        [...(preferred.image.sameUrlResolvedAlsoFrom ?? []), unpreferred.image],
        ({ link }) => link,
      ),
    },
  };
};

export const mergeResultFn =
  (def: ImageDef, image: ImageType, defs: ImageDef[]) =>
  (prevImages: ImagesType) => {
    if (image == null) {
      return prevImages;
    }

    const defIds = defs.map(getImageDefId);

    const mergedUnsorted = prevImages.map(
      (item) => mergeTwoImages(item, { image, def }) ?? item,
    );
    if (!prevImages.some((item) => mergeTwoImages(item, { image, def }))) {
      mergedUnsorted.push({ image, def });
    }

    return mergedUnsorted.sort((a, b) => {
      const aIndex = defIds.indexOf(getImageDefId(a.def));
      const bIndex = defIds.indexOf(getImageDefId(b.def));
      return aIndex - bIndex;
    });
  };

const getInitialState = (defs: ImageDef[]) =>
  defs?.filter(isInstant)?.map((def) => ({
    def,
    image: getInstantImage(def),
  })) ?? [];

export const useLoadImages = () => {
  const { feature } = useFeatureContext();
  const defs = feature?.imageDefs;
  const apiDefs = useMemo(() => defs?.filter(not(isInstant)) ?? [], [defs]);

  const initialState = useMemo(() => getInitialState(defs), [defs]);
  const [loading, setLoading] = useState(apiDefs.length > 0);
  const [images, setImages] = useState<ImagesType>(initialState);

  useEffect(() => {
    setImages(initialState);
    const promises = apiDefs.map(async (def) => {
      const image = await getImageFromApi(def);
      setImages(mergeResultFn(def, image, defs));
    });

    Promise.all(promises).then(() => {
      setLoading(false);
    });
  }, [apiDefs, defs, initialState]);

  publishDbgObject('last images', images);
  return { loading, images: images.filter((item) => item.image != null) };
};
