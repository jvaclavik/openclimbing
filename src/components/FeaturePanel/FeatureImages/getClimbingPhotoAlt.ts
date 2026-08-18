import { getLabel, getSeoPoiType } from '../../../helpers/featureLabel';
import { t } from '../../../services/intl';
import { Feature, ImageDef, isTag } from '../../../services/types';
import { photoNameKey } from '../Climbing/utils/photo';

const photoTitleFromDef = (def: ImageDef) => {
  if (!isTag(def)) return '';
  return photoNameKey(def.v).replace(/\.[a-z0-9]+$/i, '');
};

export const getClimbingPhotoAlt = (feature: Feature, def: ImageDef) => {
  const type = getSeoPoiType(feature);
  const name = getLabel(feature);
  const photo = photoTitleFromDef(def);
  if (photo && photo.toLowerCase() !== name.toLowerCase()) {
    return t('featurepanel.photo_alt_named', { type, name, photo });
  }
  return t('featurepanel.photo_alt', { type, name });
};
