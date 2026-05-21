import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import {
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { LogoOpenClimbing } from '../../../assets/LogoOpenClimbing';

import { getLabel } from '../../../helpers/featureLabel';
import { getFullOsmappLink, getShortId } from '../../../services/helpers';
import { getCommonsImageUrl } from '../../../services/images/getCommonsImageUrl';
import { t } from '../../../services/intl';
import { TickStyleBadge } from '../../../services/my-ticks/TickStyleBadge';
import {
  getDifficulties,
  getDifficulty,
  getDifficultyColor,
} from '../../../services/tagging/climbing/routeGrade';
import { ClimbingTick } from '../../../types';
import { Feature } from '../../../services/types';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useTicksContext } from '../../utils/TicksContext';
import { osmToClimbingRoutes } from './contexts/osmToClimbingRoutes';
import { ConvertedRouteDifficultyBadge } from './ConvertedRouteDifficultyBadge';
import { ClimbingRoute, PathPoints, PointType, TickStyle } from './types';
import {
  getWikimediaCommonsPhotoValues,
  removeFilePrefix,
} from './utils/photo';
import { parseProtectionPointsByPhoto } from './utils/protectionPathTags';
import { getShiftForStartPoint } from './utils/startPoint';

type Dims = { w: number; h: number };

const PrintRoot = styled.div`
  background: #fff;
  color: #000;
  padding: 24px;

  @media print {
    padding: 0;
  }
`;

const CragTitle = styled.span`
  font-family: 'Piazzolla', serif;
  font-size: 18px;
  font-weight: 700;
`;

const CragMeta = styled.span`
  font-size: 11px;
  color: #555;
`;

const BrandHeader = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 6px;
  margin-bottom: 10px;
  border-bottom: 1px solid #ddd;
`;

const BrandLogoWrap = styled.span`
  display: inline-flex;
  align-self: center;
`;

const BrandSpacer = styled.span`
  flex: 1 1 auto;
`;

const BrandText = styled.span`
  font-family: 'Piazzolla', serif;
  font-weight: 900;
  font-size: 16px;
  color: #eb5757;
  letter-spacing: 0.3px;
`;

const HeaderSep = styled.span`
  color: #ccc;
`;

const GpsLink = styled.a`
  font-family: monospace;
  font-size: 11px;
  color: #2962a6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PhotoBlock = styled.div`
  margin: 8px 0 14px 0;

  @media (max-width: 700px) {
    margin: 4px 0 8px 0;
  }
`;

const AllRoutesHeading = styled.h2`
  font-family: 'Piazzolla', serif;
  font-size: 18px;
  margin: 28px 0 8px 0;
  border-top: 1px solid #ddd;
  padding-top: 14px;
`;

const CragSectionHeading = styled.h2`
  font-family: 'Piazzolla', serif;
  font-size: 22px;
  font-weight: 700;
  margin: 24px 0 0 0;
  padding-top: 14px;
  border-top: 2px solid #bbb;

  &:first-of-type {
    margin-top: 4px;
    padding-top: 0;
    border-top: 0;
  }
`;

const CragSectionMeta = styled.div`
  font-size: 11px;
  color: #555;
  margin: 2px 0 4px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
`;

const RoutesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
  font-size: 13px;

  th,
  td {
    padding: 6px 8px;
    border-bottom: 1px solid #ddd;
    text-align: left;
    vertical-align: top;
  }

  th {
    font-weight: 600;
    background: #f4f4f4;
    border-bottom: 1px solid #888;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
`;

const NumCell = styled.td`
  width: 36px;
  font-weight: 700;
  text-align: center !important;
`;

const TickCell = styled.td`
  width: 32px;
  text-align: center !important;
`;

const GradeCell = styled.td`
  width: 90px;
  font-family: monospace;
  font-weight: 700;
  white-space: nowrap;
`;

const RouteName = styled.div`
  font-weight: 700;
`;

const RouteDescription = styled.div`
  font-size: 11px;
  color: #555;
  margin-top: 2px;
`;

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  color: #555;
  gap: 12px;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: #e9e9e9;
  display: flex;
  flex-direction: column;
`;

const OverlayHeader = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.palette.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 1;
`;

const OverlayScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const PrintStyles = () => (
  <style
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: `
        @media print {
          /* CRITICAL: the app's global CSS sets
               html, body, #__next { height: 100%; position: fixed; ... }
             which locks the body to viewport size and makes print engines
             render only one page. Override that here so content can flow. */
          html, body, #__next {
            position: static !important;
            inset: auto !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            left: auto !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            overscroll-behavior: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }
          /* Hide everything except our portal'd overlay */
          body > *:not(.pdf-export-print-portal) {
            display: none !important;
          }
          .pdf-no-print {
            display: none !important;
          }
          /* The overlay itself becomes part of the document flow */
          .pdf-export-overlay {
            position: static !important;
            inset: auto !important;
            overflow: visible !important;
            background: #fff !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
          }
          .pdf-export-print-root {
            position: static !important;
            background: #fff !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .pdf-export-print-root,
          .pdf-export-print-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4; margin: 10mm; }
          a { color: #000; text-decoration: underline; }
        }
      `,
    }}
  />
);

const fileForPath = (path: string) => `File:${path}`;

const useImageDims = (photoPaths: string[]) => {
  const [dims, setDims] = useState<Record<string, Dims>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!photoPaths || photoPaths.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const promises = photoPaths.map(
      (photoPath) =>
        new Promise<[string, Dims]>((resolve) => {
          const url = getCommonsImageUrl(fileForPath(photoPath), 1920);
          if (!url) {
            resolve([photoPath, { w: 1920, h: 1080 }]);
            return;
          }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () =>
            resolve([
              photoPath,
              {
                w: img.naturalWidth || 1920,
                h: img.naturalHeight || 1080,
              },
            ]);
          img.onerror = () => resolve([photoPath, { w: 1920, h: 1080 }]);
          img.src = url;
        }),
    );
    Promise.all(promises).then((results) => {
      if (cancelled) return;
      setDims(Object.fromEntries(results));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [photoPaths]);

  return { dims, loading };
};

const getDasharray = (
  previousLineType: 'solid' | 'dotted' | undefined,
  stroke: number,
) => (previousLineType === 'dotted' ? `${stroke} ${stroke * 4}` : undefined);

type RouteLineForPdfProps = {
  pathPx: { x: number; y: number; previousLineType?: 'solid' | 'dotted' }[];
  stroke: string;
  strokeWidth: number;
};
const RouteLineForPdf = ({
  pathPx,
  stroke,
  strokeWidth,
}: RouteLineForPdfProps) => (
  <>
    {pathPx.slice(0, -1).map((p1, i) => {
      const p2 = pathPx[i + 1];
      return (
        <line
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={getDasharray(p2.previousLineType, strokeWidth)}
        />
      );
    })}
  </>
);

type MarkerProps = {
  cx: number;
  cy: number;
  type: PointType;
  /**
   * Scale factor from "screen pixels" (the unit system used by crag-modal marker
   * components like Bolt/Sling/Piton/Anchor) into user units of the PDF SVG
   * (which uses the image's natural-pixel viewBox). Pre-computed from dims.w.
   */
  s: number;
};

// Re-uses the exact SVG paths from the crag-modal point components
// (Bolt, Sling, Piton, Anchor, UnfinishedPoint) so the PDF matches the editor.
// Colors are forced black foreground + white halo for max legibility on photos.
const PdfMarker = ({ cx, cy, type, s }: MarkerProps) => {
  const border = '#ffffff';
  const fg = '#000000';

  if (type === 'bolt') {
    const size = 14;
    const sw = 2.5;
    const shift = size / 2 - sw / 2;
    return (
      <g
        transform={`translate(${cx} ${cy}) scale(${s}) translate(0 ${-size / 2 - sw / 2}) rotate(45)`}
      >
        <rect
          x={0}
          y={shift}
          width={size}
          height={sw}
          fill="transparent"
          stroke={border}
          strokeWidth={sw}
        />
        <rect
          x={shift}
          y={0}
          width={sw}
          height={size}
          fill="transparent"
          stroke={border}
          strokeWidth={sw}
        />
        <rect x={0} y={shift} width={size} height={sw} fill={fg} />
        <rect x={shift} y={0} width={sw} height={size} fill={fg} />
      </g>
    );
  }

  if (type === 'sling') {
    const d =
      'M2 2C4.66667 4.74576 10.6667 9.32203 10.6667 14.2034C10.6667 17.5593 9.33333 20 7 20C4.66667 20 3.33333 17.5593 3.33333 14.2034C3.33333 9.32203 9.33333 4.74576 12 2';
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(15 -10)`}>
        <path
          d={d}
          stroke={border}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={d}
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  if (type === 'piton') {
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(-4 -6)`}>
        <path
          d="M1.72357 5.2168L24 1.6255"
          stroke={border}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx={18.4758}
          cy={6.49978}
          r={3.37429}
          stroke={border}
          strokeWidth={4}
          fill="none"
        />
        <path
          d="M1.72357 5.2168L24 1.6255"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx={18.4758}
          cy={6.49978}
          r={3.37429}
          stroke={fg}
          strokeWidth={2}
          fill="none"
        />
      </g>
    );
  }

  if (type === 'anchor') {
    const r = 5;
    return (
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(5 0)`}>
        <circle
          cx={0}
          cy={0}
          r={r}
          fill="none"
          strokeWidth={5}
          stroke={border}
        />
        <g transform="translate(-1.5 0)">
          <path d="M6.55 0.5L6.55 16.95" stroke={border} strokeWidth={5} />
          <path
            d="M2 12.75L6.55 18L11.1 12.75"
            stroke={border}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <circle cx={0} cy={0} r={r} fill="none" strokeWidth={3} stroke={fg} />
        <g transform="translate(-1.5 0)">
          <path d="M6.55 0.5L6.55 16.95" stroke={fg} strokeWidth={3} />
          <path
            d="M2 12.75L6.55 18L11.1 12.75"
            stroke={fg}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    );
  }

  if (type === 'unfinished') {
    const size = 12;
    const sw = 1;
    return (
      <g
        transform={`translate(${cx} ${cy}) scale(${s}) translate(${-size / 2 - sw / 2} ${size / 2 + sw / 2})`}
      >
        <polygon
          stroke={border}
          fill={fg}
          strokeWidth={sw}
          points={`0,0 ${size},0 ${size / 2},-${size}`}
        />
      </g>
    );
  }

  return null;
};

type RouteNumberBadgeProps = {
  routeNumber: number;
  cx: number;
  cy: number;
  unit: number;
  fill: string;
  isTicked: boolean;
};

const RouteNumberBadge = ({
  routeNumber,
  cx,
  cy,
  unit,
  fill,
  isTicked,
}: RouteNumberBadgeProps) => {
  const digits = String(routeNumber).length;
  const width = unit * (digits > 2 ? 5.5 + digits * 1.2 : 6);
  const height = unit * 6;
  const yTop = cy + unit * 2;

  return (
    <g>
      <rect
        x={cx - width / 2 - unit * 0.3}
        y={yTop - unit * 0.3}
        width={width + unit * 0.6}
        height={height + unit * 0.6}
        rx={unit * 3.3}
        ry={unit * 3.3}
        fill="#fff"
      />
      <rect
        x={cx - width / 2}
        y={yTop}
        width={width}
        height={height}
        rx={unit * 3}
        ry={unit * 3}
        fill={fill}
      />
      {isTicked && (
        <g
          transform={`translate(${cx - width / 2 - unit * 1.4} ${
            yTop + height / 2
          })`}
        >
          <circle r={unit * 1.6} fill="#fff" />
          <circle r={unit * 1.3} fill="#2e7d32" />
          <path
            d={`M ${-unit * 0.6} 0 L ${-unit * 0.1} ${unit * 0.55} L ${
              unit * 0.7
            } ${-unit * 0.55}`}
            stroke="#fff"
            strokeWidth={unit * 0.35}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      <text
        x={cx}
        y={yTop + height / 2 + unit * 1.4}
        textAnchor="middle"
        fontFamily="Roboto, sans-serif"
        fontWeight={700}
        fontSize={unit * 4}
        fill="#fff"
      >
        {routeNumber}
      </text>
    </g>
  );
};

type RouteRow = { route: ClimbingRoute; displayNumber: number };

const RoutesSummary = ({
  items,
  ticks,
}: {
  items: RouteRow[];
  ticks: ClimbingTick[] | null;
}) => {
  if (items.length === 0) return null;

  const getTickStyle = (route: ClimbingRoute): TickStyle | null => {
    const shortId = route.feature?.osmMeta
      ? getShortId(route.feature.osmMeta)
      : '';
    if (!shortId || !ticks) return null;
    const tick = ticks.find((tk) => tk.shortId === shortId);
    return tick ? (tick.style as TickStyle) : null;
  };

  return (
    <RoutesTable>
      <thead>
        <tr>
          <th style={{ width: 36, textAlign: 'center' }}>#</th>
          <th>{t('climbingpanel.pdf_export_route_name')}</th>
          <th style={{ width: 48, textAlign: 'center' }}>
            {t('climbingpanel.pdf_export_tick_short')}
          </th>
          <th style={{ width: 110 }}>{t('climbingpanel.pdf_export_grade')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map(({ route, displayNumber }) => {
          const tickStyle = getTickStyle(route);
          const color = getDifficultyColor(
            getDifficulty(route.feature.tags),
            'light',
          );
          const difficulties = getDifficulties(route.feature.tags);
          const name = route.feature.tags?.name || '—';
          const description = route.feature.tags?.description;
          return (
            <tr key={`${route.id}-${displayNumber}`}>
              <NumCell>
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: 22,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: color,
                    color: '#fff',
                    fontSize: 12,
                  }}
                >
                  {displayNumber}
                </span>
              </NumCell>
              <td>
                <RouteName>{name}</RouteName>
                {description ? (
                  <RouteDescription>{description}</RouteDescription>
                ) : null}
              </td>
              <TickCell>
                {tickStyle != null ? <TickStyleBadge style={tickStyle} /> : ''}
              </TickCell>
              <GradeCell>
                <ConvertedRouteDifficultyBadge
                  routeDifficulties={difficulties}
                />
              </GradeCell>
            </tr>
          );
        })}
      </tbody>
    </RoutesTable>
  );
};

type PhotoExportProps = {
  photoPath: string;
  dims: Dims;
  routes: ClimbingRoute[];
  protectionPoints: PathPoints;
  isTicked: (shortId: string) => boolean;
  ticks: ClimbingTick[] | null;
};

const PhotoExport = ({
  photoPath,
  dims,
  routes,
  protectionPoints,
  isTicked,
  ticks,
}: PhotoExportProps) => {
  const imageUrl = getCommonsImageUrl(fileForPath(photoPath), 1920);
  const unit = Math.max(2, dims.w / 200); // base unit for stroke/text sizing
  const strokeWidth = unit * 0.9;
  const borderWidth = strokeWidth * 1.7;
  // Markers from crag modal use coordinates in screen-pixel units. The PDF SVG
  // viewBox is at image-natural-pixel scale, so we need to scale markers up by
  // roughly the ratio of natural width to rendered print width.
  const markerScale = dims.w / 700;

  const photoRoutes: RouteRow[] = routes
    .map((route, idx) => ({ route, displayNumber: idx + 1 }))
    .filter(({ route }) => {
      const p = route.paths?.[photoPath];
      return p && p.length > 0;
    });

  return (
    <PhotoBlock>
      <svg
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        width={dims.w}
        height={dims.h}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '22cm',
          margin: '0 auto',
          height: 'auto',
        }}
      >
        <image href={imageUrl} width={dims.w} height={dims.h} />

        {routes.map((route, routeIndex) => {
          const path = route.paths?.[photoPath];
          if (!path || path.length === 0) return null;
          const pathPx = path.map((p) => ({
            x: p.x * dims.w,
            y: p.y * dims.h,
            previousLineType: p.previousLineType,
          }));
          const strokeColor = getDifficultyColor(
            getDifficulty(route.feature.tags),
            'light',
          );
          return (
            <React.Fragment key={routeIndex}>
              {pathPx.length > 1 && (
                <>
                  <RouteLineForPdf
                    pathPx={pathPx}
                    stroke="#ffffff"
                    strokeWidth={borderWidth}
                  />
                  <RouteLineForPdf
                    pathPx={pathPx}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                </>
              )}

              {path.map((p, pi) => {
                if (!p.type) return null;
                return (
                  <PdfMarker
                    key={`${routeIndex}-marker-${pi}`}
                    cx={p.x * dims.w}
                    cy={p.y * dims.h}
                    type={p.type}
                    s={markerScale}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {protectionPoints?.map((p, idx) =>
          p.type ? (
            // eslint-disable-next-line react/no-array-index-key
            <PdfMarker
              key={`prot-${idx}`}
              cx={p.x * dims.w}
              cy={p.y * dims.h}
              type={p.type}
              s={markerScale}
            />
          ) : null,
        )}

        {routes.map((route, routeIndex) => {
          const path = route.paths?.[photoPath];
          if (!path || path.length === 0) return null;
          const start = path[0];
          const strokeColor = getDifficultyColor(
            getDifficulty(route.feature.tags),
            'light',
          );
          const shortId = route.feature?.osmMeta
            ? getShortId(route.feature.osmMeta)
            : '';
          // Multi-route start-point shift: if earlier routes start at the same
          // point, this badge is nudged to the right so numbers sit side by
          // side instead of overlapping. Returned value is in screen px, so we
          // convert to user units via markerScale.
          const shiftPx = getShiftForStartPoint({
            currentRouteSelectedIndex: routeIndex,
            currentPosition: start,
            checkedRoutes: routes,
            photoPath,
          });
          return (
            <RouteNumberBadge
              key={`num-${routeIndex}`}
              routeNumber={routeIndex + 1}
              cx={start.x * dims.w + shiftPx * markerScale}
              cy={start.y * dims.h}
              unit={unit}
              fill={strokeColor}
              isTicked={shortId ? isTicked(shortId) : false}
            />
          );
        })}
      </svg>

      <RoutesSummary items={photoRoutes} ticks={ticks} />
    </PhotoBlock>
  );
};

const formatCoord = (value: number) => value.toFixed(5);

const buildMapyComUrl = (lon: number, lat: number) =>
  `https://mapy.com/turisticka?q=${lat}%C2%B0%20${lon}%C2%B0`;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Computes the photos that should be exported for one crag:
 * crag-level photos + per-route paths, but only those that actually have a
 * route drawn on them. Used both by `CragPdfSection` and the parent to
 * aggregate the global photo list for image preloading.
 */
const getCragExportPhotoPaths = (
  feature: Feature,
  routes: ClimbingRoute[],
): string[] => {
  const cragPhotos = getWikimediaCommonsPhotoValues(feature.tags).map(
    removeFilePrefix,
  );
  const routePhotos = routes.flatMap((r) =>
    r.paths ? Object.keys(r.paths) : [],
  );
  const all = Array.from(new Set([...cragPhotos, ...routePhotos]));
  return all.filter((photoPath) =>
    routes.some((route) => {
      const p = route.paths?.[photoPath];
      return p && p.length > 0;
    }),
  );
};

type CragPdfSectionProps = {
  feature: Feature;
  dims: Record<string, Dims>;
  isTicked: (shortId: string) => boolean;
  ticks: ClimbingTick[] | null;
  /** Show the per-crag heading. False on single-crag exports (brand header covers it). */
  showHeading: boolean;
};

const CragPdfSection = ({
  feature,
  dims,
  isTicked,
  ticks,
  showHeading,
}: CragPdfSectionProps) => {
  const routes = useMemo(() => osmToClimbingRoutes(feature), [feature]);

  const protectionPointsByPhoto = useMemo(
    () => parseProtectionPointsByPhoto(feature.tags),
    [feature.tags],
  );

  const photoPathsForExport = useMemo(
    () => getCragExportPhotoPaths(feature, routes),
    [feature, routes],
  );

  const label = getLabel(feature);
  const center = feature.center;
  const [lon, lat] = center ?? [];

  return (
    <>
      {showHeading && (
        <>
          <CragSectionHeading>{label}</CragSectionHeading>
          <CragSectionMeta>
            <span>
              {t('climbingpanel.pdf_export_routes_count', {
                count: routes.length,
              })}
            </span>
            {lat != null && lon != null && (
              <>
                <HeaderSep>·</HeaderSep>
                <GpsLink
                  href={getFullOsmappLink(feature)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {formatCoord(lat)}, {formatCoord(lon)}
                </GpsLink>
                <GpsLink
                  href={buildMapyComUrl(lon, lat)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (Mapy.com)
                </GpsLink>
              </>
            )}
          </CragSectionMeta>
        </>
      )}

      {photoPathsForExport.map((photoPath) => {
        const d = dims[photoPath];
        if (!d) return null;
        return (
          <PhotoExport
            key={photoPath}
            photoPath={photoPath}
            dims={d}
            routes={routes}
            protectionPoints={protectionPointsByPhoto?.[photoPath] ?? []}
            isTicked={isTicked}
            ticks={ticks}
          />
        );
      })}

      <AllRoutesHeading>
        {t('climbingpanel.pdf_export_all_routes')}
      </AllRoutesHeading>
      <RoutesSummary
        items={routes.map((route, idx) => ({
          route,
          displayNumber: idx + 1,
        }))}
        ticks={ticks}
      />
    </>
  );
};

export const ClimbingPdfExportDialog = ({ isOpen, onClose }: Props) => {
  const { feature } = useFeatureContext();
  const { isTicked, ticks } = useTicksContext();

  // For climbing=area, iterate over its child crags; otherwise treat the
  // feature itself as a single crag.
  const isArea = feature.tags.climbing === 'area';
  const crags: Feature[] = useMemo(
    () =>
      isArea
        ? (feature.memberFeatures ?? []).filter(
            (f) => f.tags?.climbing === 'crag',
          )
        : [feature],
    [feature, isArea],
  );

  // Aggregate every crag's photos so the loader can preload them all at once
  // and the Print button only enables when everything is ready.
  const allPhotoPaths = useMemo(() => {
    const paths: string[] = [];
    for (const crag of crags) {
      const routes = osmToClimbingRoutes(crag);
      paths.push(...getCragExportPhotoPaths(crag, routes));
    }
    return Array.from(new Set(paths));
  }, [crags]);

  const { dims, loading } = useImageDims(allPhotoPaths);

  const label = getLabel(feature);
  const center = feature.center;
  const [lon, lat] = center ?? [];
  const totalRoutesCount = useMemo(
    () =>
      crags.reduce((acc, crag) => acc + osmToClimbingRoutes(crag).length, 0),
    [crags],
  );

  const printRootRef = useRef<HTMLDivElement>(null);

  // Render nothing until after first client mount: the dialog uses a portal to

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => {
    // In-page print: PrintStyles' @media print rules unlock body sizing
    // (overriding the global `body { position: fixed }`) so the browser can
    // paginate. Works on mobile too, where window.open + cross-window print
    // is unreliable.
    window.print();
  };

  if (!isOpen || !mounted) return null;

  return ReactDOM.createPortal(
    <Overlay className="pdf-export-overlay pdf-export-print-portal">
      <PrintStyles />
      <OverlayHeader className="pdf-no-print">
        <Typography variant="h6" sx={{ flex: 1 }}>
          {t('climbingpanel.pdf_export_title')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={loading}
          sx={{ mr: 1 }}
        >
          {t('climbingpanel.pdf_export_print')}
        </Button>
        <Tooltip title={t('climbingpanel.pdf_export_close')}>
          <IconButton color="primary" edge="end" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </OverlayHeader>

      <OverlayScroll>
        <PrintRoot ref={printRootRef} className="pdf-export-print-root">
          <BrandHeader>
            <CragTitle>{label}</CragTitle>
            <CragMeta>
              {t('climbingpanel.pdf_export_routes_count', {
                count: totalRoutesCount,
              })}
            </CragMeta>
            {lat != null && lon != null && (
              <>
                <HeaderSep>·</HeaderSep>
                <GpsLink
                  href={getFullOsmappLink(feature)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {formatCoord(lat)}, {formatCoord(lon)}
                </GpsLink>
                <GpsLink
                  href={buildMapyComUrl(lon, lat)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (Mapy.com)
                </GpsLink>
              </>
            )}
            <BrandSpacer />
            <BrandLogoWrap>
              <LogoOpenClimbing width={20} />
            </BrandLogoWrap>
            <BrandText>openclimbing.org</BrandText>
          </BrandHeader>

          {loading ? (
            <LoadingWrap>
              <CircularProgress size={20} />
              <span>{t('climbingpanel.pdf_export_loading')}</span>
            </LoadingWrap>
          ) : (
            crags.map((crag) => (
              <CragPdfSection
                key={crag.osmMeta.id}
                feature={crag}
                dims={dims}
                isTicked={isTicked}
                ticks={ticks}
                showHeading={isArea}
              />
            ))
          )}
        </PrintRoot>
      </OverlayScroll>
    </Overlay>,
    document.body,
  );
};
