import type {
  ExpressionSpecification,
  LayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';

export const POI_CATEGORIES_SOURCE = 'poi_categories';

const onHover = (hovered: number, normal: number): ExpressionSpecification => [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  hovered,
  normal,
];

// A zoom expression has to stay top level, so the hover variant is applied to
// each stop value instead of wrapping the whole ramp.
const zoomRamp = (
  stops: [zoom: number, value: number][],
  hoverExtra = 0,
): ExpressionSpecification =>
  [
    'interpolate',
    ['linear'],
    ['zoom'],
    ...stops.flatMap(([zoom, value]) => [
      zoom,
      hoverExtra ? onHover(value + hoverExtra, value) : value,
    ]),
  ] as ExpressionSpecification;

// Icons are normalized to `ICON_TARGET_PX` in poiCategoriesSource, the circle
// only adds padding around them.
const RADIUS_STOPS: [number, number][] = [
  [13, 9],
  [16, 10.5],
  [19, 11.5],
];
const SHADOW_STOPS = RADIUS_STOPS.map(
  ([zoom, value]) => [zoom, value + 0.5] as [number, number],
);

// `poi-` prefix also makes these layers clickable, see `layersWithOsmId()`
export const poiCategoriesLayers: LayerSpecification[] = [
  {
    id: 'poi-categories-shadow',
    type: 'circle',
    source: POI_CATEGORIES_SOURCE,
    paint: {
      'circle-radius': zoomRamp(SHADOW_STOPS, 2),
      'circle-color': 'rgba(28, 30, 33, 0.28)',
      'circle-blur': 0.65,
      'circle-translate': [0, 1.5],
    },
  } as LayerSpecification,
  {
    id: 'poi-categories-circle',
    type: 'circle',
    source: POI_CATEGORIES_SOURCE,
    metadata: { clickableWithOsmId: true },
    paint: {
      'circle-radius': zoomRamp(RADIUS_STOPS, 2),
      'circle-color': ['get', 'poiFill'],
      'circle-stroke-color': ['get', 'poiColor'],
      'circle-stroke-width': zoomRamp(
        [
          [13, 1.6],
          [19, 2.4],
        ],
        1.1,
      ),
    },
  } as LayerSpecification,
  {
    id: 'poi-categories-symbol',
    type: 'symbol',
    source: POI_CATEGORIES_SOURCE,
    metadata: { clickableWithOsmId: true },
    layout: {
      'icon-image': '{poiIcon}_11',
      'icon-size': ['coalesce', ['get', 'poiIconSize'], 1],
      // The circles below are not part of the symbol collision grid, so icons
      // must never be hidden – otherwise empty markers would be left behind.
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': '{name}',
      'text-font': ['Noto Sans Medium', 'Noto Sans Regular'],
      'text-size': 11.5,
      'text-max-width': 8,
      'text-padding': 6,
      'text-optional': true,
      // Labels move around the marker to fit in, instead of overlapping it
      'text-variable-anchor': ['bottom', 'top', 'right', 'left'],
      'text-radial-offset': 1.4,
      'text-justify': 'auto',
    },
    paint: {
      'text-color': '#2b2f33',
      'text-halo-color': 'rgba(255, 255, 255, 0.9)',
      'text-halo-width': 1.6,
      'text-halo-blur': 0.4,
    },
  } as LayerSpecification,
];
