import { getLabel } from '../../../helpers/featureLabel';
import { Feature, LonLatBoth } from '../../../services/types';
import { View } from '../../utils/MapStateContext';
import { OSM_WEBSITE } from '../../../services/osm/consts';
import { getFeatureBbox } from '../../../services/getCenter';
import { isValidLonLat } from '../Climbing/utils/cragCenter';

// iD loads OSM data only from zoom 16, a lone node is best seen up close.
const ID_MIN_ZOOM = 16;
const ID_MAX_ZOOM = 19;
const ID_VIEWPORT_PX = 1400; // roughly what the bbox has to fit into

const getContrained = (view: View) => {
  const [z, lon, lat] = view.map(parseFloat);
  const constrained = [z > ID_MIN_ZOOM ? z : ID_MIN_ZOOM, lon, lat];
  return constrained.join('/');
};

const getZoomForSpan = (spanDegrees: number) => {
  if (!(spanDegrees > 0)) return ID_MAX_ZOOM;
  const zoom = Math.floor(Math.log2(ID_VIEWPORT_PX / spanDegrees));
  return Math.min(ID_MAX_ZOOM, Math.max(ID_MIN_ZOOM, zoom));
};

// Where iD should look at the feature. Without it iD zooms only to entities it
// can load quickly – a big relation (climbing area) leaves it on the whole world.
const getFeatureMapHash = (feature: Feature) => {
  const bbox = getFeatureBbox(feature);
  const center = isValidLonLat(feature.center)
    ? feature.center
    : bbox && [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  if (!isValidLonLat(center)) return undefined;

  const span = bbox ? Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]) : 0;
  const [lon, lat] = center;
  return `${getZoomForSpan(span)}/${lat.toFixed(6)}/${lon.toFixed(6)}`;
};

const hasOsmId = (feature: Feature | undefined) =>
  !feature?.nonOsmObject &&
  feature?.osmMeta?.id > 0 &&
  ['node', 'way', 'relation'].includes(feature.osmMeta.type);

export const getIdEditorLink = (feature: Feature, view?: View) => {
  // a clicked coordinate has a made-up negative id – only its position matters
  const query = hasOsmId(feature)
    ? `?${feature.osmMeta.type}=${feature.osmMeta.id}`
    : '';

  const map =
    (feature && getFeatureMapHash(feature)) ??
    (view ? getContrained(view) : undefined);
  const hash = map ? `#map=${map}` : '';

  return `${OSM_WEBSITE}/edit${query}${hash}`;
};

export const getAppleMapsLink = (
  feature: Feature,
  position: LonLatBoth,
  isSateliteActive: boolean,
) => {
  const layer = isSateliteActive
    ? 'h' // satelite
    : 'm'; // normal

  const markerLabel = getLabel(feature);
  return `https://maps.apple.com/?ll=${position[1]},${position[0]}&t=${layer}&q=${markerLabel}`;
};
