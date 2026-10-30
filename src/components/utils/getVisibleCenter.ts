import type * as maplibregl from 'maplibre-gl';
import { getFeaturePanelWidth } from './featurePanelWidth';

/**
 * map.getCenter() returns the center of the whole canvas, which on desktop sits
 * partly under the left panel. This is the center of the part the user sees.
 */
export const getVisibleCenter = (
  map: maplibregl.Map,
  panelShown: boolean,
): maplibregl.LngLat => {
  const { clientWidth, clientHeight } = map.getCanvas();
  const featurePanelWidth = getFeaturePanelWidth();
  const panelWidth =
    panelShown && clientWidth > featurePanelWidth ? featurePanelWidth : 0;

  return map.unproject([
    panelWidth + (clientWidth - panelWidth) / 2,
    clientHeight / 2,
  ]);
};
