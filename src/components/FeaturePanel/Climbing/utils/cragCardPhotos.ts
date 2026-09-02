import { ImageDef, isTag } from '../../../../services/types';
import { getImageDefId } from '../../../../services/images/getImageDefs';
import { ImagesType } from '../../FeatureImages/useLoadImages';

export type CragCardPhotoItem =
  | ImagesType[number]
  | { def: ImageDef; image: null };

export const getCragCardPhotoItems = ({
  defs,
  images,
  loading,
  limit,
}: {
  defs: ImageDef[] | undefined;
  images: ImagesType;
  loading: boolean;
  limit: number;
}): CragCardPhotoItem[] => {
  const loaded = images.slice(0, limit);
  if (!loading) {
    return loaded;
  }

  const known = (defs ?? []).filter(isTag).slice(0, limit);
  const loadedIds = new Set(loaded.map((item) => getImageDefId(item.def)));
  const placeholders = known
    .filter((def) => !loadedIds.has(getImageDefId(def)))
    .map((def) => ({ def, image: null as null }));

  return [...loaded, ...placeholders].slice(0, limit);
};
