import styled from '@emotion/styled';
import maplibregl from 'maplibre-gl';
import React, { useEffect, useRef, useState } from 'react';
import { Feature } from '../../../services/types';
import { touristStyle } from '../../Map/styles/touristStyle';
import { routes, transformMemberFeaturesToGeojson } from './CragMap';

// Rendered offscreen at this fixed pixel size, then captured to a PNG that is
// embedded into the printed page. A 5:3-ish ratio fits nicely on A4 width.
const CAPTURE_W = 1100;
const CAPTURE_H = 720;

const emptyGeojson = {
  type: 'geojson' as const,
  data: {
    type: 'FeatureCollection' as const,
    features: [],
  },
};

// Match the crag labels on the main map: red when the crag has photos, black
// otherwise (the map uses grey, but the user asked for black on the print).
const CRAG_COLOR_WITH_IMAGES = '#ea5540';
const CRAG_COLOR_NO_IMAGES = '#000000';

const cragColor = (hasImages: boolean) =>
  hasImages ? CRAG_COLOR_WITH_IMAGES : CRAG_COLOR_NO_IMAGES;

// Draws an upward triangle (like the crag markers on the main map) centred at
// (x, y): a white triangle with a smaller coloured triangle inside, so the
// white border reads as a wide outline and the coloured centre stays compact.
const drawCragTriangle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hasImages: boolean,
  scale: number,
) => {
  const w = 16 * scale;
  const h = 14 * scale;
  const verts: [number, number][] = [
    [x, y - h / 2],
    [x + w / 2, y + h / 2],
    [x - w / 2, y + h / 2],
  ];
  const centroidY = y + h / 6;
  const path = (vs: [number, number][]) => {
    ctx.beginPath();
    ctx.moveTo(vs[0][0], vs[0][1]);
    ctx.lineTo(vs[1][0], vs[1][1]);
    ctx.lineTo(vs[2][0], vs[2][1]);
    ctx.closePath();
  };

  // White outer triangle (the border), with a faint edge so it stays crisp.
  ctx.lineJoin = 'round';
  path(verts);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 1 * scale;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.stroke();

  // Smaller coloured triangle, scaled towards the centroid.
  const f = 0.58;
  const inner = verts.map(
    ([vx, vy]) =>
      [x + (vx - x) * f, centroidY + (vy - centroidY) * f] as [number, number],
  );
  path(inner);
  ctx.fillStyle = cragColor(hasImages);
  ctx.fill();
};

type LabelPoint = {
  name: string;
  x: number;
  y: number;
  hasImages: boolean;
};
type Box = { x: number; y: number; w: number; h: number };

const rectsOverlap = (a: Box, b: Box, margin = 0): boolean =>
  a.x < b.x + b.w + margin &&
  a.x + a.w + margin > b.x &&
  a.y < b.y + b.h + margin &&
  a.y + a.h + margin > b.y;

/**
 * Draws each sector name near its marker, picking a non-overlapping position
 * and connecting it back to the marker with a thin leader line. Greedy: labels
 * are placed one by one, each taking the first candidate offset that clears the
 * markers and already-placed labels (falling back to the least-overlapping one).
 */
const compositeSectorLabels = (
  ctx: CanvasRenderingContext2D,
  points: LabelPoint[],
  scale: number,
  canvasW: number,
  canvasH: number,
) => {
  const FONT = `700 ${Math.round(14 * scale)}px 'Noto Sans', sans-serif`;
  const padX = 4 * scale;
  const padY = 3 * scale;
  const lineH = 17 * scale;
  ctx.font = FONT;
  ctx.textBaseline = 'middle';

  // Marker keep-out rects so labels don't sit on top of any dot.
  const markerRects: Box[] = points.map((p) => ({
    x: p.x - 7 * scale,
    y: p.y - 7 * scale,
    w: 14 * scale,
    h: 14 * scale,
  }));

  // Candidate placements: many directions × distances spiralling out from the
  // marker. Leader lines let us push labels far away, so the search reaches well
  // across the map to guarantee crowded sectors still find a clear spot.
  const DIR_COUNT = 24;
  const dirs: [number, number][] = [];
  for (let i = 0; i < DIR_COUNT; i += 1) {
    const a = (i / DIR_COUNT) * Math.PI * 2;
    dirs.push([Math.cos(a), Math.sin(a)]);
  }
  const radii: number[] = [];
  for (let r = 12; r <= 320; r += 14) radii.push(r * scale);

  // Overlap area between two boxes (0 if disjoint), used to rank fallbacks.
  const overlapArea = (a: Box, b: Box, margin: number): number => {
    const dx =
      Math.min(a.x + a.w + margin, b.x + b.w) - Math.max(a.x - margin, b.x);
    const dy =
      Math.min(a.y + a.h + margin, b.y + b.h) - Math.max(a.y - margin, b.y);
    return dx > 0 && dy > 0 ? dx * dy : 0;
  };

  const placed: { box: Box; point: LabelPoint }[] = [];

  // Place the most crowded points first (those with the closest neighbour),
  // they have the fewest options. Ties broken deterministically by position.
  const nearestDist = (p: LabelPoint) => {
    let min = Infinity;
    for (const q of points) {
      if (q === p) continue;
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < min) min = d;
    }
    return min;
  };
  const ordered = [...points].sort(
    (a, b) => nearestDist(a) - nearestDist(b) || a.y - b.y || a.x - b.x,
  );

  for (const point of ordered) {
    const textW = ctx.measureText(point.name).width;
    const w = textW + padX * 2;
    const h = lineH + padY * 2;

    let best: Box | null = null;
    let bestScore = Infinity;
    let foundClean = false;

    for (const r of radii) {
      for (const [ux, uy] of dirs) {
        const cx = point.x + ux * (r + w / 2);
        const cy = point.y + uy * (r + h / 2);
        const box: Box = { x: cx - w / 2, y: cy - h / 2, w, h };

        // Keep fully on-canvas.
        if (
          box.x < 2 * scale ||
          box.y < 2 * scale ||
          box.x + box.w > canvasW - 2 * scale ||
          box.y + box.h > canvasH - 2 * scale
        ) {
          continue;
        }

        // Score = overlap area (labels weighted far heavier than markers) plus
        // a small pull towards the marker so clean labels stay close.
        const distPull = r * 0.0001;
        let overlap = 0;
        for (const m of markerRects) overlap += overlapArea(box, m, 2 * scale);
        for (const pl of placed) {
          overlap += overlapArea(box, pl.box, 3 * scale) * 50;
        }

        if (overlap + distPull < bestScore) {
          bestScore = overlap + distPull;
          best = box;
        }
        if (overlap === 0) {
          foundClean = true; // smallest-radius clear spot wins
          break;
        }
      }
      if (foundClean) break;
    }

    if (best) placed.push({ box: best, point });
  }

  // Pass 1: leader lines (white), stopping at the label's nearest edge so they
  // never cross the text (there is no background box).
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8 * scale;
  for (const { box, point } of placed) {
    const ex = Math.max(box.x, Math.min(point.x, box.x + box.w));
    const ey = Math.max(box.y, Math.min(point.y, box.y + box.h));
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Pass 2: the sector markers (triangles, like the main map), on top of the
  // leader-line origin.
  for (const { point } of placed) {
    drawCragTriangle(ctx, point.x, point.y, point.hasImages, scale);
  }

  // Pass 3: text – bold, coloured by photo presence, with a wide white outline
  // (halo) and no background, matching the crag labels on the main map.
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  for (const { box, point } of placed) {
    const tx = box.x + padX;
    const ty = box.y + box.h / 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * scale;
    ctx.strokeText(point.name, tx, ty);
    ctx.fillStyle = cragColor(point.hasImages);
    ctx.fillText(point.name, tx, ty);
  }
};

// Largest "nice" value (1/2/5 × 10ⁿ) not exceeding `max`, like map scale bars.
const niceMeters = (max: number): number => {
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const c of [5, 2, 1]) {
    if (c * pow <= max) return c * pow;
  }
  return pow / 2;
};

/**
 * Draws a metric scale bar in the bottom-left corner, sized from the map's real
 * ground resolution at its centre. The captured PNG can't include MapLibre's
 * DOM `ScaleControl`, so we render an equivalent onto the 2D canvas.
 */
const drawScaleBar = (
  ctx: CanvasRenderingContext2D,
  map: maplibregl.Map,
  scale: number,
  canvasH: number,
) => {
  const MAX_CSS = 100;
  const container = map.getContainer();
  const cx = container.clientWidth / 2;
  const cy = container.clientHeight / 2;
  const maxMeters = map
    .unproject([cx, cy])
    .distanceTo(map.unproject([cx + MAX_CSS, cy]));
  if (!Number.isFinite(maxMeters) || maxMeters <= 0) return;

  const meters = niceMeters(maxMeters);
  const widthPx = MAX_CSS * (meters / maxMeters) * scale;
  const label = meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;

  const margin = 12 * scale;
  const tick = 6 * scale;
  const x0 = margin;
  const y0 = canvasH - margin;

  const drawBar = () => {
    ctx.beginPath();
    ctx.moveTo(x0, y0 - tick);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + widthPx, y0);
    ctx.lineTo(x0 + widthPx, y0 - tick);
  };

  // White halo underneath, then the dark bar on top.
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 4 * scale;
  drawBar();
  ctx.stroke();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2 * scale;
  drawBar();
  ctx.stroke();

  ctx.font = `${Math.round(12 * scale)}px 'Noto Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3 * scale;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.strokeText(label, x0 + widthPx / 2, y0 - tick - 2 * scale);
  ctx.fillStyle = '#333333';
  ctx.fillText(label, x0 + widthPx / 2, y0 - tick - 2 * scale);
};

// Lives in the document flow only so MapLibre has a sized container to render
// into. Pushed far offscreen so it never affects the on-screen preview, and
// `pdf-no-print` keeps it out of the actual print output.
const CaptureContainer = styled.div`
  position: fixed;
  top: 0;
  left: -100000px;
  width: ${CAPTURE_W}px;
  height: ${CAPTURE_H}px;
  pointer-events: none;
`;

const MapSection = styled.div`
  margin: 14px 0 18px 0;
  page-break-inside: avoid;
  break-inside: avoid;
`;

const MapImg = styled.img`
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const collectCoords = (crags: Feature[]): [number, number][] => {
  const coords: [number, number][] = [];
  for (const crag of crags) {
    if (crag.center) coords.push(crag.center as [number, number]);
    for (const member of crag.memberFeatures ?? []) {
      if (member.center) coords.push(member.center as [number, number]);
    }
  }
  return coords;
};

type Props = {
  /** The exported feature – a `climbing=area` or a single crag. */
  feature: Feature;
  /** Crags to plot (the area's child crags, or the single crag itself). */
  crags: Feature[];
  /** Whether the export is a whole area (show sector names) vs a single crag. */
  isArea: boolean;
  /** Called once with whether the map is ready (or can be skipped). */
  onReady: (ready: boolean) => void;
};

/**
 * Renders the sector/area on a MapLibre map (reusing the live "turistická mapa"
 * `touristStyle` and climbing route layers), captures it as a PNG once tiles
 * have settled, and embeds the snapshot as the final page of the PDF export.
 *
 * For a single crag it plots its routes; for an area it instead plots each
 * child sector as a named marker so the overview stays readable. The camera is
 * fit to the actual points so the zoom matches where the climbing is.
 */
export const ClimbingPdfExportMap = ({
  feature,
  crags,
  isArea,
  onReady,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const coords = collectCoords(crags);
    if (!feature.center && coords.length === 0) {
      // Nothing to show – don't block the Print button.
      onReadyRef.current(true);
      return undefined;
    }
    if (feature.center) coords.push(feature.center as [number, number]);

    const container = containerRef.current;
    if (!container) return undefined;

    const memberFeatures = crags.flatMap((crag) => crag.memberFeatures ?? []);

    const cragLabelFeatures = crags
      .filter((crag) => crag.center && crag.tags?.name)
      .map((crag) => ({
        type: 'Feature' as const,
        properties: {
          name: crag.tags.name,
          hasImages:
            !!crag.properties?.osmappHasImages ||
            (crag.imageDefs?.length ?? 0) > 0,
        },
        geometry: { type: 'Point' as const, coordinates: crag.center },
      }));

    const map = new maplibregl.Map({
      container,
      style: {
        ...touristStyle,
        layers: [...touristStyle.layers, ...routes],
        sources: { ...touristStyle.sources, climbing: emptyGeojson },
      },
      attributionControl: false,
      refreshExpiredTiles: false,
      interactive: false,
      // Required so getCanvas().toDataURL() returns the rendered pixels.
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    let done = false;
    const finish = (ready: boolean) => {
      if (done) return;
      done = true;
      onReadyRef.current(ready);
    };

    map.on('load', () => {
      // Area overview → named sector markers; single crag → its route points.
      const climbingSource = map.getSource('climbing') as
        | maplibregl.GeoJSONSource
        | undefined;
      climbingSource?.setData({
        type: 'FeatureCollection' as const,
        features: isArea
          ? []
          : transformMemberFeaturesToGeojson(memberFeatures),
      });

      if (coords.length > 1) {
        const bounds = coords.reduce(
          (acc, coord) => acc.extend(coord),
          new maplibregl.LngLatBounds(coords[0], coords[0]),
        );
        map.fitBounds(bounds, { padding: 80, duration: 0, maxZoom: 18 });
      } else {
        map.jumpTo({ center: coords[0], zoom: 16 });
      }

      // `idle` fires after the camera settled and all tiles finished loading.
      map.once('idle', () => {
        try {
          // Composite the base map onto a 2D canvas so we can draw the scale bar
          // (and, for areas, the sector labels) on top — neither MapLibre's DOM
          // ScaleControl nor collision-avoided leader lines survive a raw
          // toDataURL of the GL canvas. `map.project` returns CSS pixels, the GL
          // canvas is at device resolution — `scale` bridges the two.
          const gl = map.getCanvas();
          const scale = gl.width / container.clientWidth;
          const out = document.createElement('canvas');
          out.width = gl.width;
          out.height = gl.height;
          const ctx = out.getContext('2d');
          ctx.drawImage(gl, 0, 0);

          if (isArea && cragLabelFeatures.length > 0) {
            const labelPoints = cragLabelFeatures.map((f) => {
              const { x, y } = map.project(
                f.geometry.coordinates as [number, number],
              );
              return {
                name: f.properties.name as string,
                hasImages: f.properties.hasImages,
                x: x * scale,
                y: y * scale,
              };
            });
            compositeSectorLabels(
              ctx,
              labelPoints,
              scale,
              out.width,
              out.height,
            );
          }

          drawScaleBar(ctx, map, scale, out.height);

          setImageUrl(out.toDataURL('image/png'));
          finish(true);
        } catch {
          // Tainted canvas or capture failure – skip the map, keep export usable.
          finish(true);
        }
      });
    });

    map.on('error', () => finish(true));

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, crags, isArea]);

  return (
    <>
      {!imageUrl && (
        <CaptureContainer className="pdf-no-print" ref={containerRef} />
      )}
      {imageUrl && (
        <MapSection>
          <MapImg src={imageUrl} alt="" />
        </MapSection>
      )}
    </>
  );
};
