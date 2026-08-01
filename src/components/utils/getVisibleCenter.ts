import type maplibregl from 'maplibre-gl';
import { FEATURE_PANEL_WIDTH } from './PanelHelpers';

/**
 * map.getCenter() returns the center of the whole canvas, which on desktop sits
 * partly under the left panel. This is the center of the part the user sees.
 */
export const getVisibleCenter = (
  map: maplibregl.Map,
  panelShown: boolean,
): maplibregl.LngLat => {
  const { clientWidth, clientHeight } = map.getCanvas();
  const panelWidth =
    panelShown && clientWidth > FEATURE_PANEL_WIDTH ? FEATURE_PANEL_WIDTH : 0;

  return map.unproject([
    panelWidth + (clientWidth - panelWidth) / 2,
    clientHeight / 2,
  ]);
};
