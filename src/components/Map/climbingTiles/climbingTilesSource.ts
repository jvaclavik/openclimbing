import { GeoJSONSource } from 'maplibre-gl';
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
import { join } from '../../../utils';
import { mapClimbingFilter } from '../../utils/userSettings/mapClimbingFilter';
import { decodeHistogram } from '../../../server/climbing-tiles/overpass/histogram';
import { constructOutlines } from './constructOutlines';
import { Interval, PoiTypes } from '../../utils/userSettings/getClimbingFilter';

const getTileJson = async ({ z, x, y }: Tile) => {
  try {
    const url = `${CLIMBING_TILES_HOST}api/climbing-tiles/tile?z=${z}&x=${x}&y=${y}`;
    const data = await fetchJson(url); // this is cached by fetchCache
    return (data.features || []) as ClimbingTilesFeature[];
  } catch (e) {
    console.warn('climbingTiles fetch error:', e); // eslint-disable-line no-console
    return [];
  }
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

const getGrade = (properties: ClimbingTilesProperties) => {
  const userSystem = mapClimbingFilter.userSystem;
  const convertedGrade = GRADE_TABLE[userSystem]?.[properties.gradeId];
  return convertedGrade ? convertedGrade : properties.gradeTxt;
};

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
  poiTypes: PoiTypes;
  climbingTypes: string[];
  inclinations: string[];
  materials: string[];
  familyFriendly: boolean;
};

const matchesAttributeFilters = (
  feature: ClimbingTilesFeature,
  { climbingTypes, inclinations, materials, familyFriendly }: FilterParams,
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
  return true;
};

export const filterClimbingTilesFeatures = (
  features: ClimbingTilesFeature[],
  params: FilterParams,
): ClimbingTilesFeature[] => {
  const { gradeInterval, minimumRoutes, isDefaultFilter, poiTypes } = params;
  return features.filter((feature) => {
    const { type, routeCount, gradeId, histogramCode } = feature.properties;

    if (type === 'gym') return poiTypes.gym;
    if (type === 'ferrata') return poiTypes.ferrata;

    if (type === 'crag' || type === 'area') {
      if (!poiTypes.rock) return false;
      if (isDefaultFilter) return true;
      if (!matchesAttributeFilters(feature, params)) return false;

      // grade / minimum-routes is the only dimension left to check
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

    // route / route_top
    if (gradeId) {
      if (!poiTypes.rock) return false;
      if (!matchesAttributeFilters(feature, params)) return false;
      const [minIndex, maxIndex] = gradeInterval;
      return gradeId >= minIndex && gradeId <= maxIndex;
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
    poiTypes: mapClimbingFilter.poiTypes ?? {
      rock: true,
      ferrata: true,
      gym: true,
    },
    climbingTypes: mapClimbingFilter.climbingTypes ?? [],
    inclinations: mapClimbingFilter.inclinations ?? [],
    materials: mapClimbingFilter.materials ?? [],
    familyFriendly: mapClimbingFilter.familyFriendly ?? false,
  });

const updateData = async () => {
  const map = getGlobalMap();
  const mapZoom = map.getZoom();
  const z = mapZoom >= 13 ? 12 : mapZoom >= 10 ? 9 : mapZoom >= 7 ? 6 : 0;

  const bounds = map.getBounds();
  const northWest = bounds.getNorthWest();
  const southEast = bounds.getSouthEast();

  const tiles = computeTiles(z, northWest, southEast);

  const promises = tiles.map((tile) => getTileJson(tile)); // TODO consider showing results after each tile is loaded
  const data = await Promise.all(promises);

  const features: ClimbingTilesFeature[] = [];
  for (const tileFeatures of data) {
    features.push(...tileFeatures);
  }
  const filteredFeatures = doClimbingFilter(features);

  const boxes = constructOutlines(features);

  map?.getSource<GeoJSONSource>(CLIMBING_TILES_SOURCE)?.setData({
    type: 'FeatureCollection' as const,
    features: [...filteredFeatures.map(processFeature), ...boxes],
  });
};

mapClimbingFilter.callback = updateData;

let eventsAdded = false;

export const addClimbingTilesSource = (style: StyleSpecification) => {
  style.sources[CLIMBING_TILES_SOURCE] = EMPTY_GEOJSON_SOURCE;
  style.sprite = [...OSMAPP_SPRITE, CLIMBING_SPRITE];
  style.layers.push(...climbingLayers); // must be also in `layersWithOsmId` because of hover effect

  if (!eventsAdded) {
    const map = getGlobalMap();
    map.on('load', updateData);
    map.on('styledata', updateData);
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
