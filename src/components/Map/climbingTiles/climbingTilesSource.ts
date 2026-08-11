import debounce from 'lodash/debounce';
import { fetchJson } from '../../../services/fetch';
import { EMPTY_GEOJSON_SOURCE, OSMAPP_SPRITE } from '../consts';
import { getGlobalMap } from '../../../services/mapStorage';
import { climbingLayers } from './climbingLayers/climbingLayers';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import {
  ClimbingTilesFeature,
  ClimbingTilesProperties,
  Tile,
} from '../../../types';
import { computeTiles } from './computeTiles';
import { CLIMBING_TILES_HOST } from '../../../services/osm/consts';
import { CLIMBING_SPRITE, CLIMBING_TILES_SOURCE } from './consts';
import {
  GRADE_TABLE,
  gradeColors,
} from '../../../services/tagging/climbing/gradeData';
import { getGradeLabel } from '../../../services/tagging/climbing/routeGrade';
import { join } from '../../../utils';
import { mapClimbingFilter } from '../../utils/userSettings/mapClimbingFilter';
import { decodeHistogram } from '../../../server/climbing-tiles/overpass/histogram';
import { constructOutlines } from './constructOutlines';
import { reapplySelectedOutline } from './selectedOutline';
import {
  beginClimbingSourceUpdate,
  commitClimbingSourceData,
  getClimbingTilesSource,
} from './climbingFeatureState';
import {
  Interval,
  PhotoDrawnFilter,
  PoiTypes,
} from '../../utils/userSettings/getClimbingFilter';
import { lengthOverlapsFilter } from '../../../services/tagging/climbing/parseClimbingLength';

const getTileJson = async ({ z, x, y }: Tile) => {
  try {
    const url = `${CLIMBING_TILES_HOST}api/climbing-tiles/tile?z=${z}&x=${x}&y=${y}&v=7`;
    const data = await fetchJson(url); // this is cached by fetchCache
    return (data.features || []) as ClimbingTilesFeature[];
  } catch (e) {
    console.warn('climbingTiles fetch error:', e); // eslint-disable-line no-console
    return [];
  }
};

/** Overlapping tiles (and line+point copies) can repeat the same feature id. */
const dedupeClimbingFeatures = (features: ClimbingTilesFeature[]) => {
  const byKey = new Map<string, ClimbingTilesFeature>();
  for (const feature of features) {
    const key = `${feature.id}:${feature.geometry?.type ?? ''}`;
    byKey.set(key, feature);
  }
  return [...byKey.values()];
};

const numberToSuperScript = (number?: number) =>
  number && number > 1
    ? number.toString().replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])
    : '';

const getLabelWithRouteCount = (name: string, routeCount: number) =>
  join(name, '\n', numberToSuperScript(routeCount));

const getColor = (gradeId: number): string | undefined => {
  if (gradeId) {
    return gradeColors[GRADE_TABLE.uiaa[gradeId]]?.light;
  }

  return undefined;
};

const joinLabel = (...params: string[]) => params.filter(Boolean).join(' ');

const getGrade = (properties: ClimbingTilesProperties) =>
  getGradeLabel(
    properties.gradeId,
    properties.gradeTxt,
    mapClimbingFilter.userSystem,
  );

const processFeature = (
  feature: ClimbingTilesFeature,
): ClimbingTilesFeature => {
  const properties = feature.properties;

  const color = getColor(properties.gradeId);
  const prefix = properties.type === 'route_top' ? '[top]' : '';

  const grade = getGrade(properties);
  const label = joinLabel(prefix, properties.name, grade);

  return {
    ...feature,
    properties: {
      ...properties,
      label: getLabelWithRouteCount(label, properties.routeCount),
      color,
    },
  };
};

type FilterParams = {
  gradeInterval: Interval;
  minimumRoutes: number;
  isDefaultFilter: boolean;
  isGradeIntervalDefault: boolean;
  isMinimumRoutesDefault: boolean;
  isLengthIntervalDefault: boolean;
  poiTypes: PoiTypes;
  climbingTypes: string[];
  inclinations: string[];
  materials: string[];
  familyFriendly: boolean;
  photoDrawn: PhotoDrawnFilter;
  lengthInterval: Interval;
};

const osmIdFromFeatureId = (id: string | number | undefined) =>
  id == null || Number.isNaN(Number(id))
    ? undefined
    : Math.floor(Number(id) / 10);

const lengthFromProps = (props: ClimbingTilesProperties) => {
  if (props.lengthMin == null && props.lengthMax == null) {
    return null;
  }
  return {
    min: props.lengthMin ?? props.lengthMax!,
    max: props.lengthMax ?? props.lengthMin!,
  };
};

/** Route/feature with known length must overlap; missing length stays visible. */
const matchesOwnLength = (
  feature: ClimbingTilesFeature,
  { isLengthIntervalDefault, lengthInterval }: FilterParams,
): boolean => {
  if (isLengthIntervalDefault) return true;
  const length = lengthFromProps(feature.properties);
  if (!length) return true;
  return lengthOverlapsFilter(length, lengthInterval[0], lengthInterval[1]);
};

/**
 * Crag/area: prefer live child routes in this tile. If neither children nor the
 * group itself have climbing:length, hide when the length filter is active.
 */
const matchesGroupLength = (
  feature: ClimbingTilesFeature,
  params: FilterParams,
  routesByParent: Map<number, ClimbingTilesFeature[]>,
): boolean => {
  if (params.isLengthIntervalDefault) return true;

  const [filterMin, filterMax] = params.lengthInterval;
  const osmId = osmIdFromFeatureId(feature.id);
  const children = osmId != null ? routesByParent.get(osmId) : undefined;
  if (children?.length) {
    const withLength = children
      .map((child) => lengthFromProps(child.properties))
      .filter(Boolean);
    if (withLength.length > 0) {
      return withLength.some((length) =>
        lengthOverlapsFilter(length!, filterMin, filterMax),
      );
    }
  }

  const ownLength = lengthFromProps(feature.properties);
  if (!ownLength) return false;
  return lengthOverlapsFilter(ownLength, filterMin, filterMax);
};

const matchesAttributeFilters = (
  feature: ClimbingTilesFeature,
  {
    climbingTypes,
    inclinations,
    materials,
    familyFriendly,
    photoDrawn,
  }: FilterParams,
): boolean => {
  const props = feature.properties;

  if (
    climbingTypes.length > 0 &&
    !climbingTypes.some((type) => props.climbingTypes?.includes(type))
  ) {
    return false;
  }
  if (
    inclinations.length > 0 &&
    !inclinations.some((value) => props.inclinations?.includes(value))
  ) {
    return false;
  }
  if (
    materials.length > 0 &&
    !materials.some((value) => props.materials?.includes(value))
  ) {
    return false;
  }
  if (familyFriendly && !props.familyFriendly) {
    return false;
  }
  if (photoDrawn !== 'any') {
    const withPhoto = !!props.hasImages;
    if (photoDrawn === 'with' ? !withPhoto : withPhoto) {
      return false;
    }
  }
  return true;
};

export const filterClimbingTilesFeatures = (
  features: ClimbingTilesFeature[],
  params: FilterParams,
): ClimbingTilesFeature[] => {
  const { gradeInterval, minimumRoutes, isDefaultFilter, poiTypes } = params;

  const routesByParent = new Map<number, ClimbingTilesFeature[]>();
  for (const feature of features) {
    const { type, parentId } = feature.properties;
    if (
      (type === 'route' || type === 'route_top') &&
      parentId != null &&
      Number.isFinite(parentId)
    ) {
      const list = routesByParent.get(parentId) ?? [];
      list.push(feature);
      routesByParent.set(parentId, list);
    }
  }

  return features.filter((feature) => {
    const { type, routeCount, gradeId, histogramCode } = feature.properties;

    if (type === 'gym') return poiTypes.gym;
    if (type === 'ferrata') return poiTypes.ferrata;

    if (type === 'crag' || type === 'area') {
      if (!poiTypes.rock) return false;
      if (isDefaultFilter) return true;
      if (!matchesAttributeFilters(feature, params)) return false;
      if (!matchesGroupLength(feature, params, routesByParent)) return false;

      if (params.isGradeIntervalDefault && params.isMinimumRoutesDefault) {
        return true;
      }

      if (routeCount && histogramCode) {
        const [minIndex, maxIndex] = gradeInterval;
        const histogram = decodeHistogram(histogramCode);
        const filteredRouteCount = histogram
          .slice(minIndex, maxIndex)
          .reduce((a, b) => a + b, 0);

        return filteredRouteCount >= minimumRoutes;
      }
      return false;
    }

    if (type === 'route' || type === 'route_top') {
      if (!poiTypes.rock) return false;
      if (!matchesAttributeFilters(feature, params)) return false;
      if (!matchesOwnLength(feature, params)) return false;

      // Same as grades: only constrain routes that have a grade.
      if (gradeId != null) {
        const [minIndex, maxIndex] = gradeInterval;
        return gradeId >= minIndex && gradeId <= maxIndex;
      }
      return true;
    }

    return true;
  });
};

const doClimbingFilter = (features: ClimbingTilesFeature[]) =>
  filterClimbingTilesFeatures(features, {
    gradeInterval: mapClimbingFilter.gradeInterval,
    minimumRoutes: mapClimbingFilter.minimumRoutes,
    isDefaultFilter: mapClimbingFilter.isDefaultFilter,
    isGradeIntervalDefault: mapClimbingFilter.isGradeIntervalDefault,
    isMinimumRoutesDefault: mapClimbingFilter.isMinimumRoutesDefault,
    isLengthIntervalDefault: mapClimbingFilter.isLengthIntervalDefault,
    poiTypes: mapClimbingFilter.poiTypes ?? {
      rock: true,
      ferrata: true,
      gym: true,
    },
    climbingTypes: mapClimbingFilter.climbingTypes ?? [],
    inclinations: mapClimbingFilter.inclinations ?? [],
    materials: mapClimbingFilter.materials ?? [],
    familyFriendly: mapClimbingFilter.familyFriendly ?? false,
    photoDrawn: mapClimbingFilter.photoDrawn ?? 'any',
    lengthInterval: mapClimbingFilter.lengthInterval,
  });

let updateGeneration = 0;

const updateData = async () => {
  const generation = ++updateGeneration;
  const map = getGlobalMap();
  // styledata / filter callback can fire while the style is being replaced
  if (!map?.getStyle?.() || !getClimbingTilesSource(map)) {
    return;
  }

  const mapZoom = map.getZoom();
  const z = mapZoom >= 13 ? 12 : mapZoom >= 10 ? 9 : mapZoom >= 7 ? 6 : 0;

  const bounds = map.getBounds();
  const northWest = bounds.getNorthWest();
  const southEast = bounds.getSouthEast();

  const tiles = computeTiles(z, northWest, southEast);

  const promises = tiles.map((tile) => getTileJson(tile)); // TODO consider showing results after each tile is loaded
  const data = await Promise.all(promises);
  if (generation !== updateGeneration) {
    return;
  }
  // Style may have been swapped while tiles were loading.
  if (!getClimbingTilesSource(map)) {
    return;
  }

  const features: ClimbingTilesFeature[] = [];
  for (const tileFeatures of data) {
    features.push(...tileFeatures);
  }
  const uniqueFeatures = dedupeClimbingFeatures(features);
  const filteredFeatures = doClimbingFilter(uniqueFeatures);

  const boxes = constructOutlines(uniqueFeatures);
  const nextFeatures = [...filteredFeatures.map(processFeature), ...boxes];

  const epoch = beginClimbingSourceUpdate(map);
  commitClimbingSourceData(
    map,
    nextFeatures as GeoJSON.Feature[],
    epoch,
    () => {
      if (generation !== updateGeneration) {
        return;
      }
      reapplySelectedOutline();
    },
  );
};

mapClimbingFilter.callback = updateData;

let eventsAdded = false;

export const addClimbingTilesSource = (style: StyleSpecification) => {
  style.sources[CLIMBING_TILES_SOURCE] = EMPTY_GEOJSON_SOURCE;
  style.sprite = [...OSMAPP_SPRITE, CLIMBING_SPRITE];
  style.layers.push(...climbingLayers); // must be also in `layersWithOsmId` because of hover effect

  if (!eventsAdded) {
    const map = getGlobalMap();
    // `styledata` fires many times during startup (each source/sprite/glyph
    // load), so debounce it to avoid re-fetching tiles and re-setting the
    // GeoJSON source several times in a row. `load` and `moveend` stay
    // immediate so data appears as soon as possible and reacts to panning.
    map.on('load', updateData);
    map.on('styledata', debounce(updateData, 200));
    map.on('moveend', updateData);
    eventsAdded = true;
  }
};

export const removeClimbingTilesSource = () => {
  if (eventsAdded) {
    const map = getGlobalMap();
    map.off('load', updateData);
    map.off('styledata', updateData);
    map.off('moveend', updateData);
    eventsAdded = false;
  }
};
