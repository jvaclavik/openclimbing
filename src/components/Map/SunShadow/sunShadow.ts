import type { CustomLayerInterface, GeoJSONFeature, Map } from 'maplibre-gl';
import earcut from 'earcut';
import SunCalc from 'suncalc';

// NOTE: don't import from `../consts` here — that module touches `window` at
// import time and this file is reachable from the SSR-rendered Map.tsx.
const apiKey = process.env.NEXT_PUBLIC_API_KEY_MAPTILER;

export const SUN_SHADOW_LAYER_ID = 'osmapp-sun-shadow';

// MapTiler terrain-rgb-v2 (Mapbox terrain-rgb encoding, webp, maxzoom 14).
const DEM_TILE_URL = (z: number, x: number, y: number) =>
  `https://api.maptiler.com/tiles/terrain-rgb-v2/${z}/${x}/${y}.webp?key=${apiKey}`;
const DEM_MAX_ZOOM = 14;
const DEM_MIN_ZOOM = 8;
// Cap how many DEM tiles we stitch per view so a single overview never tries to
// download hundreds of tiles. One tile of padding is added on every side so
// peaks just off-screen still cast shadows into the viewport.
const MAX_DEM_TILES = 64;
const TILE_PADDING = 1;

export type SunPosition = {
  /** Compass bearing of the sun in degrees, 0 = north, 90 = east. */
  azimuthDeg: number;
  /** Angle above the horizon in degrees; negative means below horizon. */
  altitudeDeg: number;
};

const toDeg = (rad: number) => (rad * 180) / Math.PI;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export const getSunPosition = (
  date: Date,
  lat: number,
  lon: number,
): SunPosition => {
  const { azimuth, altitude } = SunCalc.getPosition(date, lat, lon);
  // SunCalc azimuth is measured from south, growing towards west (radians).
  // Convert to a compass bearing measured clockwise from north.
  const azimuthDeg = (toDeg(azimuth) + 180 + 360) % 360;
  return { azimuthDeg, altitudeDeg: toDeg(altitude) };
};

export type SunTimes = {
  sunrise: Date;
  solarNoon: Date;
  sunset: Date;
};

export const getSunTimes = (date: Date, lat: number, lon: number): SunTimes => {
  const times = SunCalc.getTimes(date, lat, lon);
  return {
    sunrise: times.sunrise,
    solarNoon: times.solarNoon,
    sunset: times.sunset,
  };
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Shadow tint driven by the sun's altitude: a saturated cool indigo so the cast
// shadows read as their own thing and don't merge with the neutral grey relief
// of the basemap. Only shadowed pixels are painted; lit pixels stay transparent.
const shadowColor = (altitudeDeg: number): [number, number, number, number] => {
  if (altitudeDeg <= 0) {
    // Night: a uniform cool darkening over the whole terrain.
    return [22 / 255, 26 / 255, 66 / 255, 0.55];
  }
  const t = clamp01(altitudeDeg / 45); // 0 = horizon, 1 = high sun
  const alpha = lerp(0.5, 0.32, t);
  return [38 / 255, 40 / 255, 105 / 255, alpha];
};

// ---------------------------------------------------------------------------
// Web Mercator helpers (normalised 0..1 world coordinates).
// ---------------------------------------------------------------------------
const lngToMercX = (lng: number) => (lng + 180) / 360;
const latToMercY = (lat: number) => {
  const s = Math.sin(toRad(lat));
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};
const EARTH_CIRCUMFERENCE = 2 * Math.PI * 6378137; // metres per mercator unit at equator
// MapLibre converts altitude to mercator-z with its mean Earth radius; match it
// so our draped mesh lines up with the terrain mesh.
const MERC_Z_PER_METER = 1 / (2 * Math.PI * 6371008.8);
// Grid resolution the DEM bounds are tessellated into for terrain draping.
const GRID_SEGMENTS = 192;

type DemData = {
  /** Mercator bounds of the stitched DEM texture (x east, y south). */
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Step length, in mercator units, of one DEM texel along X. */
  texelMerc: number;
};

// ---------------------------------------------------------------------------
// Shaders. Plain GLSL ES 1.00 (works inside MapLibre's WebGL2 context). The
// fragment shader ray-marches the DEM towards the sun: for every pixel it walks
// the height map in the sun's horizontal direction and, if any terrain rises
// above the straight line of sight to the sun, the pixel is in shadow.
// ---------------------------------------------------------------------------
// The quad is tessellated into a grid so each vertex can be lifted onto the 3D
// terrain surface (when terrain is enabled), keeping the cast shadows draped on
// the relief when the map is pitched. Elevation comes from the same DEM the
// MapLibre terrain uses, so the mesh aligns with it.
const VERTEX_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define PI 3.141592653589793

uniform mat4 u_matrix;
uniform sampler2D u_dem;
uniform vec2 u_demMin;
uniform vec2 u_demMax;
uniform float u_terrainOn;   // 1.0 when 3D terrain is active
uniform float u_mercZScale;  // mercator-z units per metre at the equator
attribute vec2 a_merc;
varying vec2 v_merc;

float decodeElevationV(vec2 uv) {
  vec4 c = texture2D(u_dem, uv);
  return -10000.0 + (c.r * 255.0 * 65536.0 + c.g * 255.0 * 256.0 + c.b * 255.0) * 0.1;
}

void main() {
  v_merc = a_merc;
  vec2 uv = clamp((a_merc - u_demMin) / (u_demMax - u_demMin), 0.0, 1.0);
  float elev = decodeElevationV(uv);
  float e = PI * (1.0 - 2.0 * a_merc.y);
  float lat = atan((exp(e) - exp(-e)) * 0.5);
  float mercZ = u_terrainOn * elev * u_mercZScale / cos(lat);
  gl_Position = u_matrix * vec4(a_merc, mercZ, 1.0);
}
`;

const FRAGMENT_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define MAX_STEPS 256
#define PI 3.141592653589793

uniform sampler2D u_dem;
uniform sampler2D u_buildings; // R = building height (metres) above the terrain
uniform vec2 u_demMin;        // mercator bounds of the DEM texture
uniform vec2 u_demMax;
uniform vec2 u_sunDir;        // unit horizontal direction towards the sun (mercator space)
uniform float u_tanAlt;       // tan(sun altitude)
uniform float u_stepMerc;     // ray-march step length in mercator units
uniform float u_circumference;// metres per mercator unit at the equator
uniform vec4 u_shadowColor;
uniform float u_below;        // 1.0 when the sun is below the horizon (night)
uniform int u_maxSteps;

varying vec2 v_merc;

// Mapbox / MapTiler terrain-rgb decoding -> elevation in metres.
float decodeElevation(vec2 uv) {
  vec4 c = texture2D(u_dem, uv);
  return -10000.0 + (c.r * 255.0 * 65536.0 + c.g * 255.0 * 256.0 + c.b * 255.0) * 0.1;
}

// Surface = terrain plus any building rasterised on top (height in metres, R*255).
float surfaceElevation(vec2 uv) {
  return decodeElevation(uv) + texture2D(u_buildings, uv).r * 255.0;
}

vec2 toUv(vec2 merc) {
  return (merc - u_demMin) / (u_demMax - u_demMin);
}

bool outside(vec2 uv) {
  return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0;
}

void main() {
  vec2 uv0 = toUv(v_merc);
  if (outside(uv0)) discard; // no DEM coverage here

  if (u_below > 0.5) {
    gl_FragColor = u_shadowColor; // night: uniform darkening
    return;
  }

  float h0 = surfaceElevation(uv0);

  // Ground metres per mercator unit depends on latitude (mercator is conformal).
  // sinh() isn't available in GLSL ES 1.00, so expand it via exp().
  float e = PI * (1.0 - 2.0 * v_merc.y);
  float lat = atan((exp(e) - exp(-e)) * 0.5);
  float metersPerMerc = u_circumference * cos(lat);
  float groundPerStep = u_stepMerc * metersPerMerc;

  vec2 step = u_sunDir * u_stepMerc;
  vec2 p = v_merc;
  float groundDist = 0.0;
  float lit = 1.0;

  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= u_maxSteps) break;
    p += step;
    groundDist += groundPerStep;
    vec2 uv = toUv(p);
    if (outside(uv)) break; // marched off the DEM without being blocked

    float rayHeight = h0 + u_tanAlt * groundDist;
    float terrain = surfaceElevation(uv);
    if (terrain > rayHeight + 1.0) {
      lit = 0.0;
      break;
    }
  }

  if (lit > 0.5) discard; // lit pixels stay transparent
  gl_FragColor = u_shadowColor;
}
`;

const compile = (
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Sun shadow shader failed to compile: ${log}`);
  }
  return shader;
};

// Off-screen pass that rasterises building footprints into a single-channel
// height map (metres above the terrain), aligned to the DEM bounds. Overlapping
// footprints (e.g. building + building:part) are merged with MAX blending so the
// tallest one wins. The main ray-march then treats buildings as terrain.
const BUILDING_VERTEX_SRC = `
uniform vec2 u_demMin;
uniform vec2 u_demMax;
attribute vec2 a_pos;   // mercator 0..1
attribute float a_height;
varying float v_height;
void main() {
  vec2 uv = (a_pos - u_demMin) / (u_demMax - u_demMin);
  v_height = a_height;
  gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
}
`;

const BUILDING_FRAGMENT_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying float v_height;
void main() {
  gl_FragColor = vec4(clamp(v_height / 255.0, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;

const compileProgram = (
  gl: WebGLRenderingContext,
  vsSrc: string,
  fsSrc: string,
): WebGLProgram => {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      `Sun shadow program failed to link: ${gl.getProgramInfoLog(program)}`,
    );
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
};

// Vector sources/layers that expose building footprints, tried in order.
const BUILDING_SOURCES: Array<{ source: string; sourceLayer: string }> = [
  { source: 'maptiler_planet', sourceLayer: 'building' },
  { source: 'ofr_planet', sourceLayer: 'building' },
  { source: 'versatiles-shortbread', sourceLayer: 'buildings' },
];
const DEFAULT_BUILDING_HEIGHT = 6; // building=yes without a height -> ~2 storeys
const MAX_BUILDING_HEIGHT = 255; // texture stores height in one byte (metres)

class SunShadowLayer implements CustomLayerInterface {
  id = SUN_SHADOW_LAYER_ID;

  type = 'custom' as const;

  renderingMode = '3d' as const;

  private map: Map;

  private gl: WebGLRenderingContext | null = null;

  private program: WebGLProgram | null = null;

  private quadBuffer: WebGLBuffer | null = null;

  private indexBuffer: WebGLBuffer | null = null;

  private indexCount = 0;

  private demTexture: WebGLTexture | null = null;

  private dem: DemData | null = null;

  // Building height map (a single-channel DSM rendered off-screen).
  private buildingProgram: WebGLProgram | null = null;

  private buildingUniforms: Record<string, WebGLUniformLocation | null> = {};

  private buildingTexture: WebGLTexture | null = null;

  private buildingFbo: WebGLFramebuffer | null = null;

  private buildingBuffer: WebGLBuffer | null = null;

  private buildingVerts: Float32Array | null = null;

  private buildingVertexCount = 0;

  private buildingsDirty = false;

  private texWidth = 0;

  private texHeight = 0;

  private loadToken = 0;

  private sun: SunPosition = { azimuthDeg: 180, altitudeDeg: 0 };

  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  private readonly onMoveEnd = () => {
    this.loadDemForView();
    this.rebuildBuildingGeometry();
  };

  private readonly onIdle = () => this.rebuildBuildingGeometry();

  constructor(map: Map) {
    this.map = map;
  }

  setSun(sun: SunPosition) {
    this.sun = sun;
    this.map.triggerRepaint();
  }

  onAdd(map: Map, gl: WebGLRenderingContext) {
    this.gl = gl;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `Sun shadow program failed to link: ${gl.getProgramInfoLog(program)}`,
      );
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;

    [
      'u_matrix',
      'u_dem',
      'u_demMin',
      'u_demMax',
      'u_sunDir',
      'u_tanAlt',
      'u_stepMerc',
      'u_circumference',
      'u_shadowColor',
      'u_below',
      'u_maxSteps',
      'u_terrainOn',
      'u_mercZScale',
      'u_dem',
      'u_buildings',
    ].forEach((name) => {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    });

    this.buildingProgram = compileProgram(
      gl,
      BUILDING_VERTEX_SRC,
      BUILDING_FRAGMENT_SRC,
    );
    ['u_demMin', 'u_demMax'].forEach((name) => {
      this.buildingUniforms[name] = gl.getUniformLocation(
        this.buildingProgram!,
        name,
      );
    });

    this.quadBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    this.demTexture = gl.createTexture();
    this.buildingTexture = gl.createTexture();
    this.buildingFbo = gl.createFramebuffer();
    this.buildingBuffer = gl.createBuffer();

    map.on('moveend', this.onMoveEnd);
    map.on('idle', this.onIdle);
    this.loadDemForView();
    this.rebuildBuildingGeometry();
  }

  onRemove(_map: Map, gl: WebGLRenderingContext) {
    this.map.off('moveend', this.onMoveEnd);
    this.map.off('idle', this.onIdle);
    this.loadToken += 1; // invalidate any in-flight tile loads
    if (this.program) gl.deleteProgram(this.program);
    if (this.buildingProgram) gl.deleteProgram(this.buildingProgram);
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    if (this.buildingBuffer) gl.deleteBuffer(this.buildingBuffer);
    if (this.demTexture) gl.deleteTexture(this.demTexture);
    if (this.buildingTexture) gl.deleteTexture(this.buildingTexture);
    if (this.buildingFbo) gl.deleteFramebuffer(this.buildingFbo);
    this.program = null;
    this.buildingProgram = null;
    this.quadBuffer = null;
    this.indexBuffer = null;
    this.buildingBuffer = null;
    this.demTexture = null;
    this.buildingTexture = null;
    this.buildingFbo = null;
    this.dem = null;
  }

  // Tessellate the DEM bounds into a triangle grid. The vertex shader lifts each
  // vertex onto the terrain, so a denser grid follows the relief more closely.
  private buildGrid(dem: DemData) {
    const gl = this.gl;
    if (!gl) return;
    const n = GRID_SEGMENTS;
    const verts = new Float32Array((n + 1) * (n + 1) * 2);
    let v = 0;
    for (let row = 0; row <= n; row += 1) {
      const ty = row / n;
      const my = dem.minY + (dem.maxY - dem.minY) * ty;
      for (let col = 0; col <= n; col += 1) {
        const tx = col / n;
        verts[v] = dem.minX + (dem.maxX - dem.minX) * tx;
        verts[v + 1] = my;
        v += 2;
      }
    }
    const indices = new Uint32Array(n * n * 6);
    let i = 0;
    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        const a = row * (n + 1) + col;
        const b = a + 1;
        const c = a + (n + 1);
        const d = c + 1;
        indices[i] = a;
        indices[i + 1] = c;
        indices[i + 2] = b;
        indices[i + 3] = b;
        indices[i + 4] = c;
        indices[i + 5] = d;
        i += 6;
      }
    }
    this.indexCount = indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }

  // Collect building footprints from the vector tiles and triangulate them into
  // a flat (x, y, height) vertex list, ready to rasterise into the height map.
  private rebuildBuildingGeometry() {
    if (!this.dem) return;
    const features = this.queryBuildingFeatures();
    const data: number[] = [];

    const addRings = (rings: number[][][], height: number) => {
      if (height <= 0 || !rings.length) return;
      const flat: number[] = [];
      const holes: number[] = [];
      rings.forEach((ring, ringIdx) => {
        if (ringIdx > 0) holes.push(flat.length / 2);
        ring.forEach(([lng, lat]) => {
          flat.push(lngToMercX(lng), latToMercY(lat));
        });
      });
      const tri = earcut(flat, holes, 2);
      for (let k = 0; k < tri.length; k += 1) {
        const idx = tri[k];
        data.push(flat[idx * 2], flat[idx * 2 + 1], height);
      }
    };

    features.forEach((f) => {
      const props = f.properties || {};
      const raw = Number(props.render_height ?? props.height);
      const height = Math.min(
        MAX_BUILDING_HEIGHT,
        Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_BUILDING_HEIGHT,
      );
      const geom = f.geometry;
      if (geom?.type === 'Polygon') {
        addRings(geom.coordinates, height);
      } else if (geom?.type === 'MultiPolygon') {
        geom.coordinates.forEach((poly) => addRings(poly, height));
      }
    });

    this.buildingVerts = new Float32Array(data);
    this.buildingVertexCount = data.length / 3;
    this.buildingsDirty = true;
    this.map.triggerRepaint();
  }

  private queryBuildingFeatures(): GeoJSONFeature[] {
    const out: GeoJSONFeature[] = [];
    BUILDING_SOURCES.forEach(({ source, sourceLayer }) => {
      if (!this.map.getSource(source)) return;
      try {
        const feats = this.map.querySourceFeatures(source, { sourceLayer });
        if (feats.length) out.push(...feats);
      } catch {
        // source not ready yet
      }
    });
    return out;
  }

  // Rasterise the building footprints into the height map (off-screen). MAX
  // blending keeps the tallest footprint where building parts overlap.
  private renderBuildingPass(gl: WebGLRenderingContext) {
    if (
      !this.buildingProgram ||
      !this.buildingFbo ||
      !this.buildingTexture ||
      !this.dem
    ) {
      return;
    }
    const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const vp = gl.getParameter(gl.VIEWPORT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.buildingFbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.buildingTexture,
      0,
    );
    gl.viewport(0, 0, this.texWidth, this.texHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.buildingVertexCount > 0 && this.buildingVerts) {
      gl.useProgram(this.buildingProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buildingBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.buildingVerts, gl.DYNAMIC_DRAW);
      const aPos = gl.getAttribLocation(this.buildingProgram, 'a_pos');
      const aHeight = gl.getAttribLocation(this.buildingProgram, 'a_height');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 12, 0);
      gl.enableVertexAttribArray(aHeight);
      gl.vertexAttribPointer(aHeight, 1, gl.FLOAT, false, 12, 8);
      gl.uniform2f(
        this.buildingUniforms.u_demMin,
        this.dem.minX,
        this.dem.minY,
      );
      gl.uniform2f(
        this.buildingUniforms.u_demMax,
        this.dem.maxX,
        this.dem.maxY,
      );

      gl.enable(gl.BLEND);
      gl.blendEquation((gl as WebGL2RenderingContext).MAX);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, this.buildingVertexCount);
      gl.blendEquation(gl.FUNC_ADD);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
    gl.viewport(vp[0], vp[1], vp[2], vp[3]);
    this.buildingsDirty = false;
  }

  private pickDemZoom(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
  ) {
    let zoom = Math.max(
      DEM_MIN_ZOOM,
      Math.min(DEM_MAX_ZOOM, Math.round(this.map.getZoom())),
    );
    while (zoom > DEM_MIN_ZOOM) {
      const n = 2 ** zoom;
      const x0 = Math.floor(lngToMercX(minLng) * n) - TILE_PADDING;
      const x1 = Math.floor(lngToMercX(maxLng) * n) + TILE_PADDING;
      const y0 = Math.floor(latToMercY(maxLat) * n) - TILE_PADDING;
      const y1 = Math.floor(latToMercY(minLat) * n) + TILE_PADDING;
      if ((x1 - x0 + 1) * (y1 - y0 + 1) <= MAX_DEM_TILES) break;
      zoom -= 1;
    }
    return zoom;
  }

  private loadDemForView() {
    const gl = this.gl;
    if (!gl || !this.demTexture) return;

    const bounds = this.map.getBounds();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();

    const zoom = this.pickDemZoom(minLng, minLat, maxLng, maxLat);
    const n = 2 ** zoom;
    const x0 = Math.floor(lngToMercX(minLng) * n) - TILE_PADDING;
    const x1 = Math.floor(lngToMercX(maxLng) * n) + TILE_PADDING;
    const y0 = Math.max(0, Math.floor(latToMercY(maxLat) * n) - TILE_PADDING);
    const y1 = Math.min(
      n - 1,
      Math.floor(latToMercY(minLat) * n) + TILE_PADDING,
    );
    const cols = x1 - x0 + 1;
    const rows = y1 - y0 + 1;

    const token = (this.loadToken += 1);
    const tileSizePx = 512; // terrain-rgb-v2 ships @2x tiles
    const texWidth = cols * tileSizePx;
    const texHeight = rows * tileSizePx;

    // Allocate the full texture up-front, then drop tiles in as they decode.
    gl.bindTexture(gl.TEXTURE_2D, this.demTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // Keep the raw byte values intact (no browser colour management).
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      texWidth,
      texHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Building height map, same size/bounds so it shares the DEM's uv mapping.
    this.texWidth = texWidth;
    this.texHeight = texHeight;
    gl.bindTexture(gl.TEXTURE_2D, this.buildingTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      texWidth,
      texHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.buildingsDirty = true;

    this.dem = {
      minX: x0 / n,
      minY: y0 / n,
      maxX: (x1 + 1) / n,
      maxY: (y1 + 1) / n,
      texelMerc: 1 / n / tileSizePx,
    };
    this.buildGrid(this.dem);

    for (let ty = y0; ty <= y1; ty += 1) {
      for (let tx = x0; tx <= x1; tx += 1) {
        const wrappedX = ((tx % n) + n) % n;
        const col = tx - x0;
        const row = ty - y0;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (token !== this.loadToken || !this.gl) return; // stale view
          const g = this.gl;
          g.bindTexture(g.TEXTURE_2D, this.demTexture);
          g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false);
          g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL, g.NONE);
          g.texSubImage2D(
            g.TEXTURE_2D,
            0,
            col * tileSizePx,
            row * tileSizePx,
            g.RGBA,
            g.UNSIGNED_BYTE,
            img,
          );
          this.map.triggerRepaint();
        };
        img.onerror = () => {}; // missing DEM tile -> just leave it blank
        img.src = DEM_TILE_URL(zoom, wrappedX, ty);
      }
    }

    this.map.triggerRepaint();
  }

  render(
    gl: WebGLRenderingContext,
    options: { defaultProjectionData: { mainMatrix: Iterable<number> } },
  ) {
    if (!this.program || !this.dem || !this.demTexture || !this.indexCount) {
      return;
    }
    const { dem } = this;

    // Refresh the building height map if buildings/view changed.
    if (this.buildingsDirty) {
      this.renderBuildingPass(gl);
    }

    gl.useProgram(this.program);

    // Terrain-draped grid covering the DEM mercator bounds.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    const aMerc = gl.getAttribLocation(this.program, 'a_merc');
    gl.enableVertexAttribArray(aMerc);
    gl.vertexAttribPointer(aMerc, 2, gl.FLOAT, false, 0, 0);

    // World (mercator 0..1) -> clip space matrix supplied by MapLibre.
    gl.uniformMatrix4fv(
      this.uniforms.u_matrix,
      false,
      options.defaultProjectionData.mainMatrix,
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.demTexture);
    gl.uniform1i(this.uniforms.u_dem, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.buildingTexture);
    gl.uniform1i(this.uniforms.u_buildings, 1);

    gl.uniform2f(this.uniforms.u_demMin, dem.minX, dem.minY);
    gl.uniform2f(this.uniforms.u_demMax, dem.maxX, dem.maxY);

    const az = toRad(this.sun.azimuthDeg);
    // East = +x, North = -y (mercator y grows southward).
    gl.uniform2f(this.uniforms.u_sunDir, Math.sin(az), -Math.cos(az));

    const below = this.sun.altitudeDeg <= 0;
    gl.uniform1f(
      this.uniforms.u_tanAlt,
      Math.tan(toRad(Math.max(this.sun.altitudeDeg, 0.1))),
    );
    gl.uniform1f(this.uniforms.u_stepMerc, dem.texelMerc);
    gl.uniform1f(this.uniforms.u_circumference, EARTH_CIRCUMFERENCE);
    gl.uniform1i(this.uniforms.u_maxSteps, 256);
    gl.uniform1f(this.uniforms.u_below, below ? 1 : 0);
    // Drape onto the 3D terrain only when it's actually enabled.
    gl.uniform1f(this.uniforms.u_terrainOn, this.map.getTerrain() ? 1 : 0);
    gl.uniform1f(this.uniforms.u_mercZScale, MERC_Z_PER_METER);

    const [r, g, b, a] = shadowColor(this.sun.altitudeDeg);
    gl.uniform4f(this.uniforms.u_shadowColor, r, g, b, a);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
  }
}

// Insert the shadow below labels/POIs so they stay readable.
const firstSymbolLayerId = (map: Map): string | undefined =>
  map.getStyle()?.layers?.find((l) => l.type === 'symbol')?.id;

// Keep a handle to the live layer instance — `map.getLayer()` returns a style
// wrapper, not our CustomLayerInterface object, so we can't reach setSun() there.
let activeLayer: SunShadowLayer | null = null;

export const applySunShadow = (
  map: Map,
  date: Date,
  lat: number,
  lon: number,
): SunPosition => {
  const sun = getSunPosition(date, lat, lon);

  // setStyle() (base layer switch) wipes custom layers, so re-create if missing.
  if (!map.getLayer(SUN_SHADOW_LAYER_ID)) {
    activeLayer = new SunShadowLayer(map);
    map.addLayer(
      activeLayer as unknown as CustomLayerInterface,
      firstSymbolLayerId(map),
    );
  }
  // The basemap's own relief hillshade stays visible underneath: it gives the
  // terrain its texture while our layer adds the real cast shadows on top.
  activeLayer?.setSun(sun);
  return sun;
};

export const removeSunShadow = (map: Map) => {
  if (map.getLayer(SUN_SHADOW_LAYER_ID)) {
    map.removeLayer(SUN_SHADOW_LAYER_ID);
  }
  activeLayer = null;
};
