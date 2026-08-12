/* eslint-disable  no-underscore-dangle */
import maplibregl, { type Map } from 'maplibre-gl';
import { createMapEventHook } from '../../helpers';

export const TERRAIN_3D = {
  source: 'terrain3d',
  exaggeration: 1,
} as const;

const turnOnTerrain = (map: Map) => {
  map.setTerrain(TERRAIN_3D);
  map.setMaxPitch(85);
};

const turnOffTerrain = (map: Map) => {
  map.setTerrain(null);
  map.setMaxPitch(60);
};

class OsmappTerrainControl extends maplibregl.TerrainControl {
  _toggleTerrain = () => {
    if (this._map.getTerrain()) {
      turnOffTerrain(this._map);
    } else {
      turnOnTerrain(this._map);
    }
    this._updateTerrainIcon();
  };
}

const terrainControl = new OsmappTerrainControl(TERRAIN_3D);

let controlAdded = false;

/** Show the terrain toggle control (idempotent). */
export const ensureTerrainControl = (map: Map) => {
  if (!controlAdded) {
    map.addControl(terrainControl);
    controlAdded = true;
  }
};

/** Enter 3D terrain mode: control + DEM mesh. */
export const enableTerrain3d = (map: Map) => {
  ensureTerrainControl(map);
  if (!map.getTerrain()) {
    turnOnTerrain(map);
  } else {
    map.setMaxPitch(85);
  }
};

/** Keep 3D terrain across basemap switches when the user is pitched or terrain is on. */
export const shouldKeepTerrain3d = (map: Map) =>
  !!map.getTerrain() || map.getPitch() > 0;

export const useToggleTerrainControl = createMapEventHook((map) => ({
  eventType: 'move',
  eventHandler: () => {
    if (map.getPitch() > 0) {
      enableTerrain3d(map);
    }
  },
}));
