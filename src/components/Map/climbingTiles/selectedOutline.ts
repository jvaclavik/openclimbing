import { getGlobalMap } from '../../../services/mapStorage';
import { toOutlineMapId } from './consts';
import { setClimbingFeatureState } from './climbingFeatureState';
import {
  reapplySelectedCragRoutes,
  setSelectedCragRoutes,
} from './selectedCragRoutes';

let selectedId: number | undefined = undefined;

const setState = (id: number | undefined, selected: boolean) => {
  if (id === undefined) {
    return;
  }
  const map = getGlobalMap();
  setClimbingFeatureState(map, id, { selected });
  // Outline uses a dedicated map id so the GeoJSON source stays unique.
  setClimbingFeatureState(map, toOutlineMapId(id), { selected });
};

export const setSelectedOutline = (id: number | undefined) => {
  if (id === selectedId) {
    return;
  }
  setState(selectedId, false);
  selectedId = id;
  setState(selectedId, true);
  setSelectedCragRoutes(id);
};

// the source (or the whole style) is rebuilt behind our back - the feature
// state has to be applied again once the new data is in
export const reapplySelectedOutline = () => {
  setState(selectedId, true);
  reapplySelectedCragRoutes();
};
