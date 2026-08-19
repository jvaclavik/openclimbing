import type { Map } from 'maplibre-gl';

export const TERRAIN_3D = {
  source: 'terrain3d',
  exaggeration: 1,
} as const;

export const PREVIEW_PITCH = 60;
export const PREVIEW_MIN_ZOOM = 12;
export const PREVIEW_ZOOM = 13;

let wanted = false;

export const setTerrain3dWanted = (value: boolean) => {
  wanted = value;
};

export const turnOnTerrain = (map: Map) => {
  map.setTerrain(TERRAIN_3D);
  map.setMaxPitch(85);
  // Recalculating center/zoom on dragend snaps the camera over terrain.
  map.setCenterClampedToGround(false);
};

export const turnOffTerrain = (map: Map) => {
  map.setTerrain(null);
  map.setMaxPitch(60);
  map.setCenterClampedToGround(true);
};

/** Enter 3D terrain mode: DEM mesh + higher max pitch. */
export const enableTerrain3d = (map: Map) => {
  try {
    if (!map.getTerrain()) {
      turnOnTerrain(map);
    } else {
      map.setMaxPitch(85);
    }
  } catch {
    try {
      map.setMaxPitch(85);
    } catch {
      // style still swapping – caller may retry
    }
  }
};

/** Keep 3D terrain across basemap switches while the user left 3D on. */
export const shouldKeepTerrain3d = (map: Map) =>
  wanted || !!map.getTerrain() || map.getPitch() > 0;
