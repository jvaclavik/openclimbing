import IndoorEqual from 'maplibre-gl-indoorequal';
import 'maplibre-gl-indoorequal/maplibre-gl-indoorequal.css';
import type { Map } from 'maplibre-gl';
import { getGlobalMap, mapIdlePromise } from '../../../services/mapStorage';
import { CLIMBING_TILES_SOURCE } from '../climbingTiles/consts';

const timeout = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let indoorEqual: IndoorEqual;

const CLIMBING_SOURCES = ['climbing', CLIMBING_TILES_SOURCE];

// IndoorEqual appends its building-interior layers on top of the style, which
// would otherwise hide the climbing overlay. Move the climbing layers back to
// the top so the overlay stays above the indoor layers.
const moveClimbingAboveIndoor = (map: Map) => {
  const layers = map.getStyle()?.layers ?? [];
  layers
    .filter(
      (layer) =>
        'source' in layer && CLIMBING_SOURCES.includes(layer.source as string),
    )
    .forEach((layer) => {
      try {
        map.moveLayer(layer.id);
      } catch {
        // layer might not be present yet – ignore
      }
    });
};

export const addIndoorEqual = async () => {
  if (!process.env.NEXT_PUBLIC_API_KEY_INDOOREQUAL) {
    throw new Error('Missing API key for IndoorEqual');
  }

  // TODO this is brittle, we can probably get rid of the library and implement indoor ourselves
  // TODO 2: doesnt work in hot reload mode (localhost)
  await timeout(600);
  const map = await mapIdlePromise;

  console.log('Adding IndoorEqual'); // eslint-disable-line no-console
  indoorEqual = new IndoorEqual(map, {
    apiKey: process.env.NEXT_PUBLIC_API_KEY_INDOOREQUAL,
    heatmap: false,
  });
  indoorEqual.loadSprite('/icons-indoor/sprite/indoorequal');

  map.addControl(indoorEqual);

  // Indoor layers are added by the control above; let them settle, then lift
  // the climbing overlay back above them.
  await timeout(300);
  moveClimbingAboveIndoor(map);
};

export const removeIndoorEqual = () => {
  if (indoorEqual && indoorEqual._control) {
    const map = getGlobalMap();
    console.log('Removing IndoorEquall', map, indoorEqual); // eslint-disable-line no-console
    map.removeControl(indoorEqual);
    indoorEqual = null;
  }
};
