import { FilterSpecification } from '@maplibre/maplibre-gl-style-spec';
import { getGlobalMap } from '../../../services/mapStorage';
import { CRAG_ROUTES_LAYER } from './climbingLayers/routesPoints';

// routes carry the plain osm id of their parent relation, the map id has the
// type digit appended (see convertOsmIdToMapId)
const toParentId = (mapId: number | undefined) =>
  mapId !== undefined && mapId % 10 === 4 ? Math.floor(mapId / 10) : -1;

const getFilter = (mapId: number | undefined): FilterSpecification => [
  '==',
  ['get', 'parentId'],
  toParentId(mapId),
];

let selectedId: number | undefined = undefined;
let hoveredId: number | undefined = undefined;

const apply = () => {
  const map = getGlobalMap();
  if (!map?.getLayer(CRAG_ROUTES_LAYER)) {
    return;
  }
  map.setFilter(CRAG_ROUTES_LAYER, getFilter(hoveredId ?? selectedId));
};

export const setSelectedCragRoutes = (mapId: number | undefined) => {
  selectedId = mapId;
  apply();
};

export const setHoveredCragRoutes = (mapId: number | undefined) => {
  if (mapId === hoveredId) {
    return;
  }
  hoveredId = mapId;
  apply();
};

// the layer is recreated whenever the style is rebuilt - the filter is not
// part of the layer spec, so it has to be set again
export const reapplySelectedCragRoutes = apply;
