import type {
  LayerSpecification,
  Map,
  RasterSourceSpecification,
  StyleSpecification,
} from 'maplibre-gl';
import { CZ_BBOX } from '../Terrain3d/cuzkDem';

/** Elevation model the 3D mesh is built from. `dmr`/`dmp` are ČÚZK (CZ only,
 *  MapTiler fills in elsewhere). */
export type Terrain3dDem = 'global' | 'dmr' | 'dmp';

export const TERRAIN_3D_SOURCES: Record<Terrain3dDem, string> = {
  global: 'terrain3d',
  dmr: 'terrain3dDmr',
  dmp: 'terrain3dDmp',
};

let dem: Terrain3dDem = 'global';
let shading = true;

export const getTerrain3dSpec = () => ({
  source: TERRAIN_3D_SOURCES[dem],
  exaggeration: 1,
});

// MapLibre doesn't light the terrain mesh – its shape only reads through the
// basemap texture. With a ČÚZK model the basemap knows nothing about e.g. the
// houses/trees in DMP, so they'd be invisible bumps. Drape ČÚZK's own
// server-rendered hillshade of the same model over the basemap (below labels)
// so the relief is actually visible.
const DEM_SHADE_PREFIX = 'cuzk-dem-shade-';
const DEM_SHADE_SERVICES: Partial<Record<Terrain3dDem, string>> = {
  dmr: 'dmr5g',
  dmp: 'dmp1g',
};
// The shading goes right above the basemap's last area layer (buildings), so
// ground, buildings and roads are shaded while trails, labels and overlays
// stay crisp above it.
const SHADE_BELOW_TYPES = [
  'background',
  'raster',
  'hillshade',
  'color-relief',
  'fill',
  'fill-extrusion',
];

const getDemShade = () => {
  const service = DEM_SHADE_SERVICES[dem];
  if (!service || !shading) return null;
  const id = `${DEM_SHADE_PREFIX}${service}`;
  const source: RasterSourceSpecification = {
    type: 'raster',
    tiles: [
      `https://ags.cuzk.gov.cz/arcgis2/services/${service}/ImageServer/WMSServer?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=${service}:GrayscaleHillshade&STYLES=&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`,
    ],
    tileSize: 256,
    bounds: CZ_BBOX,
    minzoom: 10,
    maxzoom: 19,
    attribution: '&copy; <a href="https://geoportal.cuzk.cz">ČÚZK</a>',
  };
  const layer: LayerSpecification = {
    id,
    type: 'raster',
    source: id,
    paint: { 'raster-opacity': 0.5 },
  };
  return { id, source, layer };
};

/** Index the shading layer should be inserted at. */
const getShadeIndex = (layers: { id: string; type: string }[]) => {
  let last = -1;
  layers.forEach((layer, index) => {
    if (
      SHADE_BELOW_TYPES.includes(layer.type) &&
      !layer.id.startsWith(DEM_SHADE_PREFIX)
    ) {
      last = index;
    }
  });
  return last + 1;
};

// DMP already contains the buildings – basemap 3D extrusions standing on top
// of it would be doubled in height, so hide them while DMP is the terrain.
// Remember which we hid, to restore only those (some styles hide a few).
const hiddenExtrusions = new Set<string>();
const isVisibleExtrusion = (layer: LayerSpecification) =>
  layer.type === 'fill-extrusion' && layer.layout?.visibility !== 'none';

/** Apply the DEM styling to a style about to be set (basemap switch, 3D on). */
export const addDemStylingToStyle = (style: StyleSpecification) => {
  hiddenExtrusions.clear();
  if (dem === 'dmp') {
    style.layers.filter(isVisibleExtrusion).forEach((layer) => {
      hiddenExtrusions.add(layer.id);
      layer.layout = { ...layer.layout, visibility: 'none' };
    });
  }

  const shade = getDemShade();
  if (!shade) return;
  style.sources[shade.id] = shade.source;
  style.layers.splice(getShadeIndex(style.layers), 0, shade.layer);
};

const syncExtrusions = (map: Map, style: StyleSpecification) => {
  const hide = !!map.getTerrain() && dem === 'dmp';
  if (hide) {
    style.layers.filter(isVisibleExtrusion).forEach((layer) => {
      hiddenExtrusions.add(layer.id);
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    });
    return;
  }
  hiddenExtrusions.forEach((id) => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
  });
  hiddenExtrusions.clear();
};

/** Match shading + extrusions on the live map to terrain + settings. */
const syncDemStyling = (map: Map) => {
  try {
    const shade = map.getTerrain() ? getDemShade() : null;
    const style = map.getStyle();
    syncExtrusions(map, style);
    style.layers
      .filter((l) => l.id.startsWith(DEM_SHADE_PREFIX) && l.id !== shade?.id)
      .forEach((l) => map.removeLayer(l.id));
    Object.keys(style.sources)
      .filter((id) => id.startsWith(DEM_SHADE_PREFIX) && id !== shade?.id)
      .forEach((id) => map.removeSource(id));
    if (shade && !map.getLayer(shade.id)) {
      if (!map.getSource(shade.id)) map.addSource(shade.id, shade.source);
      // `style` is a snapshot – drop the shade layers removed above
      const layers = style.layers.filter(
        (l) => !l.id.startsWith(DEM_SHADE_PREFIX),
      );
      map.addLayer(shade.layer, layers[getShadeIndex(layers)]?.id);
    }
  } catch {
    // style still swapping – useUpdateStyle adds it with the next style
  }
};

/** Switch the DEM; swaps the live terrain if 3D is currently on. */
export const setTerrain3dDem = (map: Map | undefined, next: Terrain3dDem) => {
  if (!TERRAIN_3D_SOURCES[next] || next === dem) return;
  dem = next;
  if (!map) return;
  try {
    if (map.getTerrain()) map.setTerrain(getTerrain3dSpec());
  } catch {
    // style still swapping – useUpdateStyle picks up the new source
  }
  syncDemStyling(map);
};

export const setTerrain3dShading = (map: Map | undefined, next: boolean) => {
  if (next === shading) return;
  shading = next;
  if (map) syncDemStyling(map);
};

export const PREVIEW_PITCH = 60;
export const PREVIEW_MIN_ZOOM = 12;
export const PREVIEW_ZOOM = 13;

let wanted = false;

export const setTerrain3dWanted = (value: boolean) => {
  wanted = value;
};

export const turnOnTerrain = (map: Map) => {
  map.setTerrain(getTerrain3dSpec());
  map.setMaxPitch(85);
  // Recalculating center/zoom on dragend snaps the camera over terrain.
  map.setCenterClampedToGround(false);
  syncDemStyling(map);
};

export const turnOffTerrain = (map: Map) => {
  map.setTerrain(null);
  map.setMaxPitch(60);
  map.setCenterClampedToGround(true);
  syncDemStyling(map);
};

/** Enter 3D terrain mode: DEM mesh + higher max pitch. */
export const enableTerrain3d = (map: Map) => {
  try {
    if (!map.getTerrain()) {
      turnOnTerrain(map);
    } else {
      map.setMaxPitch(85);
      syncDemStyling(map);
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
