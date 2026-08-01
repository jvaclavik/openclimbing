import { useMemo } from 'react';
import { getGlobalMap } from '../../services/mapStorage';
import { useMobileMode } from '../helpers';
import { Bbox, useMapStateContext } from './MapStateContext';
import { FEATURE_PANEL_WIDTH } from './PanelHelpers';

/**
 * The bbox in MapStateContext comes from map.getBounds(), so it also covers the
 * map hidden behind the left panel. This narrows it down to the part the user
 * really sees. On mobile the panel covers almost everything, so the full bbox
 * is kept there.
 */
export const useVisibleBbox = (): Bbox | undefined => {
  const { bbox } = useMapStateContext();
  const isMobileMode = useMobileMode();

  return useMemo(() => {
    const map = getGlobalMap();
    if (!bbox || !map || isMobileMode) {
      return bbox;
    }

    const { clientWidth, clientHeight } = map.getCanvas();
    if (clientWidth <= FEATURE_PANEL_WIDTH) {
      return bbox;
    }

    const northWest = map.unproject([FEATURE_PANEL_WIDTH, 0]);
    const southEast = map.unproject([clientWidth, clientHeight]);
    return [northWest.lng, northWest.lat, southEast.lng, southEast.lat] as Bbox;
  }, [bbox, isMobileMode]);
};
