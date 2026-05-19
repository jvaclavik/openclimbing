import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import {
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { LogoOpenClimbing } from '../../../assets/LogoOpenClimbing';

import { useFeatureContext } from '../../utils/FeatureContext';
import { useTicksContext } from '../../utils/TicksContext';
import { getCommonsImageUrl } from '../../../services/images/getCommonsImageUrl';
import { osmToClimbingRoutes } from './contexts/osmToClimbingRoutes';
import { parseProtectionPointsByPhoto } from './utils/protectionPathTags';
import {
  getWikimediaCommonsPhotoValues,
  removeFilePrefix,
} from './utils/photo';
import {
  getDifficulties,
  getDifficulty,
  getDifficultyColor,
} from '../../../services/tagging/climbing/routeGrade';
import { getFullOsmappLink, getShortId } from '../../../services/helpers';
import { getLabel } from '../../../helpers/featureLabel';
import { t } from '../../../services/intl';
import { ClimbingRoute, PathPoints, PointType, TickStyle } from './types';
import { ConvertedRouteDifficultyBadge } from './ConvertedRouteDifficultyBadge';
import { TickStyleBadge } from '../../../services/my-ticks/TickStyleBadge';
import { ClimbingTick } from '../../../types';

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
  margin: 12px 0 18px 0;
`;

const PhotoCaption = styled.div`
  font-size: 11px;
  color: #555;
  margin-top: 4px;
`;

const AllRoutesHeading = styled.h2`
  font-family: 'Piazzolla', serif;
  font-size: 18px;
  margin: 28px 0 8px 0;
  border-top: 1px solid #ddd;
  padding-top: 14px;
`;

const RoutesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
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
  unit: number;
};

const PdfMarker = ({ cx, cy, type, unit }: MarkerProps) => {
  const stroke = unit * 0.4;
  const r = unit * 1.4;

  if (type === 'bolt') {
    return (
      <g transform={`translate(${cx} ${cy - r * 1.4}) rotate(45)`}>
        <rect
          x={-r}
          y={-stroke * 0.5}
          width={r * 2}
          height={stroke}
          fill="#fff"
          stroke="#000"
          strokeWidth={stroke * 0.4}
        />
        <rect
          x={-stroke * 0.5}
          y={-r}
          width={stroke}
          height={r * 2}
          fill="#fff"
          stroke="#000"
          strokeWidth={stroke * 0.4}
        />
      </g>
    );
  }
  if (type === 'anchor') {
    return (
      <g transform={`translate(${cx} ${cy - r * 1.4})`}>
        <circle r={r} fill="#fff" stroke="#000" strokeWidth={stroke * 0.5} />
        <circle r={r * 0.45} fill="#000" />
      </g>
    );
  }
  if (type === 'sling') {
    return (
      <g transform={`translate(${cx} ${cy - r * 1.4})`}>
        <rect
          x={-r * 0.6}
          y={-r}
          width={r * 1.2}
          height={r * 2}
          rx={r * 0.6}
          ry={r * 0.6}
          fill="#fff"
          stroke="#000"
          strokeWidth={stroke * 0.5}
        />
      </g>
    );
  }
  if (type === 'piton') {
    return (
      <g transform={`translate(${cx} ${cy - r * 1.4})`}>
        <polygon
          points={`0,${-r} ${r * 0.7},${r * 0.7} ${-r * 0.7},${r * 0.7}`}
          fill="#fff"
          stroke="#000"
          strokeWidth={stroke * 0.5}
        />
      </g>
    );
  }
  if (type === 'unfinished') {
    return (
      <g transform={`translate(${cx} ${cy - r * 1.4})`}>
        <line
          x1={-r}
          y1={-r}
          x2={r}
          y2={r}
          stroke="#000"
          strokeWidth={stroke}
        />
        <line
          x1={-r}
          y1={r}
          x2={r}
          y2={-r}
          stroke="#000"
          strokeWidth={stroke}
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
  title,
}: {
  items: RouteRow[];
  ticks: ClimbingTick[] | null;
  title?: string;
}) => {
  if (items.length === 0) return null;

  const getTickStyle = (route: ClimbingRoute): TickStyle | null => {
    const shortId = route.feature?.osmMeta
      ? getShortId(route.feature.osmMeta)
      : '';
    if (!shortId || !ticks) return null;
    const tick = ticks.find((t) => t.shortId === shortId);
    return tick ? (tick.style as TickStyle) : null;
  };

  return (
    <RoutesTable>
      {title ? (
        <caption
          style={{
            textAlign: 'left',
            fontSize: 12,
            color: '#555',
            padding: '4px 0',
            captionSide: 'top',
          }}
        >
          {title}
        </caption>
      ) : null}
      <thead>
        <tr>
          <th style={{ width: 36, textAlign: 'center' }}>#</th>
          <th style={{ width: 48, textAlign: 'center' }}>
            {t('climbingpanel.pdf_export_tick_short')}
          </th>
          <th>{t('climbingpanel.pdf_export_route_name')}</th>
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
              <TickCell>
                {tickStyle != null ? <TickStyleBadge style={tickStyle} /> : ''}
              </TickCell>
              <td>{route.feature.tags?.name || '—'}</td>
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
                    unit={unit}
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
              unit={unit}
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
          return (
            <RouteNumberBadge
              key={`num-${routeIndex}`}
              routeNumber={routeIndex + 1}
              cx={start.x * dims.w}
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

export const ClimbingPdfExportDialog = ({ isOpen, onClose }: Props) => {
  const { feature } = useFeatureContext();
  const { isTicked, ticks } = useTicksContext();

  const routes = useMemo(() => osmToClimbingRoutes(feature), [feature]);

  const protectionPointsByPhoto = useMemo(
    () => parseProtectionPointsByPhoto(feature.tags),
    [feature.tags],
  );

  const allPhotoPaths = useMemo(() => {
    const cragPhotos = getWikimediaCommonsPhotoValues(feature.tags).map(
      removeFilePrefix,
    );
    const routePhotos = routes.flatMap((r) =>
      r.paths ? Object.keys(r.paths) : [],
    );
    return Array.from(new Set([...cragPhotos, ...routePhotos]));
  }, [feature.tags, routes]);

  const photoPathsForExport = useMemo(
    () =>
      allPhotoPaths.filter((photoPath) =>
        routes.some((route) => {
          const p = route.paths?.[photoPath];
          return p && p.length > 0;
        }),
      ),
    [allPhotoPaths, routes],
  );

  const { dims, loading } = useImageDims(photoPathsForExport);

  const label = getLabel(feature);
  const center = feature.center;
  const [lon, lat] = center ?? [];

  const printRootRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // In-page print: PrintStyles' @media print rules unlock body sizing
    // (overriding the global `body { position: fixed }`) so the browser can
    // paginate. Works on mobile too, where window.open + cross-window print
    // is unreliable.
    window.print();
  };

  if (!isOpen || typeof document === 'undefined') return null;

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
            <BrandLogoWrap>
              <LogoOpenClimbing width={22} />
            </BrandLogoWrap>
            <BrandText>openclimbing.org</BrandText>
            <HeaderSep>|</HeaderSep>
            <CragTitle>{label}</CragTitle>
            <CragMeta>
              {t('climbingpanel.pdf_export_routes_count', {
                count: routes.length,
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
          </BrandHeader>

          {loading ? (
            <LoadingWrap>
              <CircularProgress size={20} />
              <span>{t('climbingpanel.pdf_export_loading')}</span>
            </LoadingWrap>
          ) : (
            <>
              {photoPathsForExport.map((photoPath) => {
                const d = dims[photoPath];
                if (!d) return null;
                return (
                  <PhotoExport
                    key={photoPath}
                    photoPath={photoPath}
                    dims={d}
                    routes={routes}
                    protectionPoints={
                      protectionPointsByPhoto?.[photoPath] ?? []
                    }
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
          )}
        </PrintRoot>
      </OverlayScroll>
    </Overlay>,
    document.body,
  );
};
