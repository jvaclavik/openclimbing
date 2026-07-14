import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { LogoOpenClimbing } from '../../../assets/LogoOpenClimbing';

import { getLabel } from '../../../helpers/featureLabel';
import { getFullOsmappLink, getShortId } from '../../../services/helpers';
import { getCommonsImageUrl } from '../../../services/images/getCommonsImageUrl';
import { t } from '../../../services/intl';
import { useOnlineStatus } from '../../../services/offline/useOnlineStatus';
import { TickStyleBadge } from '../../../services/my-ticks/TickStyleBadge';
import {
  findOrConvertRouteGrade,
  getDifficulties,
  getDifficulty,
  getDifficultyColor,
} from '../../../services/tagging/climbing/routeGrade';
import { Feature } from '../../../services/types';
import { ClimbingTick } from '../../../types';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useTicksContext } from '../../utils/TicksContext';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import dynamic from 'next/dynamic';
import { ClimbingBadges } from './ClimbingBadges';
import { GradeSystemSelect } from './GradeSystemSelect';
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

// Loaded client-only: it pulls in MapLibre and map styles that touch `window`
// at import time, which would break server-side rendering.
const ClimbingPdfExportMap = dynamic(
  () => import('./ClimbingPdfExportMap').then((m) => m.ClimbingPdfExportMap),
  { ssr: false },
);

const PrintRoot = styled.div`
  background: #fff;
  color: #000;
  padding: 24px;

  @media print {
    padding: 0;
  }
`;

const GuideTitle = styled.div`
  font-family: 'Piazzolla', serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  color: #333;
`;

const FeatureDescription = styled.div`
  font-size: 12px;
  color: #444;
  margin: 6px 0 10px 0;
  line-height: 1.4;
  white-space: pre-wrap;
`;

const RouteLengthChip = styled.span`
  display: inline-block;
  font-size: 11px;
  color: #555;
  margin-top: 2px;
`;

const RouteBadgesWrap = styled.div`
  margin: 3px 0 1px 0;

  &:empty {
    display: none;
  }
`;

const HazardAlert = styled.div`
  background: #fff4e5;
  border-left: 4px solid #ed6c02;
  padding: 8px 12px;
  margin: 10px 0;
  font-size: 12px;
  color: #663c00;
  border-radius: 2px;
  page-break-inside: avoid;
  break-inside: avoid;
`;

const HazardTitle = styled.div`
  font-weight: 700;
  margin-bottom: 2px;
`;

const BadgesWrap = styled.div`
  margin: 6px 0 10px 0;

  & .MuiStack-root {
    align-items: flex-start;
  }
`;

const BrandHeader = styled.div`
  margin-bottom: 12px;
`;

const Masthead = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 10px;
`;

const BrandRight = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const BrandLogoWrap = styled.span`
  display: inline-flex;
  align-items: center;
`;

const BrandText = styled.span`
  font-family: 'Piazzolla', serif;
  font-weight: 900;
  font-size: 16px;
  line-height: 1;
  color: #eb5757;
  letter-spacing: 0.3px;
`;

// The feature info block (name on line 1, meta on line 2) on the left, QR right.
const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const InfoBlock = styled.div`
  min-width: 0;
`;

// Line 1: the sector/area/crag name. The main subject (area / standalone crag)
// is rendered larger than the per-sector headings inside an area.
const FeatureName = styled.div<{ $primary?: boolean }>`
  font-family: 'Piazzolla', serif;
  font-size: ${({ $primary }) => ($primary ? '34px' : '27px')};
  font-weight: ${({ $primary }) => ($primary ? 900 : 800)};
  line-height: 1.12;
`;

// Line 2: type, route count and GPS in the same visual style as PanelLabel.
const InfoMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #737373;
`;

const InfoSep = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: #737373;
  font-size: 9px;
  font-weight: 900;
  line-height: 1;
`;

const InfoLink = styled.a`
  color: inherit;
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

const AllRoutesHeading = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 14px 0 0 0;
`;

const CragSectionHeading = styled.h2`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 22px 0 8px 0;

  &:first-of-type {
    margin-top: 6px;
  }
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

const Footer = styled.div`
  margin-top: 24px;
  font-size: 9px;
  line-height: 1.5;
  color: #888;
  text-align: center;

  a {
    color: #888;
  }
`;

const RouteName = styled.div``;

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

/**
 * Print-friendly version of `ClimbingRestriction` — that component depends on
 * `useFeatureContext`, while here we want to render the alert for arbitrary
 * features (area or each crag inside it).
 */
const FeatureHazardAlert = ({ feature }: { feature: Feature }) => {
  const restriction = feature.tags?.['climbing:restriction'];
  const description = feature.tags?.['climbing:restriction:time_description'];
  if (!restriction && !description) return null;
  return (
    <HazardAlert>
      <HazardTitle>{t('featurepanel.climbing_restriction')}</HazardTitle>
      {description}
    </HazardAlert>
  );
};

/**
 * Renders feature-level extras shared between brand header (top feature) and
 * per-crag sections inside an area: long-form description, climbing-type and
 * hazard badges, plus an access-restriction warning.
 */
const FeatureExtras = ({ feature }: { feature: Feature }) => {
  const description = feature.tags?.description;
  // Bail out cheaply when nothing to show. ClimbingBadges renders an empty
  // wrapper for features with no relevant tags, but it still mounts MUI Stack,
  // which we'd rather avoid in the printed tree.
  const hasBadges = Object.keys(feature.tags ?? {}).some(
    (k) => k.startsWith('climbing:') && feature.tags?.[k] === 'yes',
  );
  return (
    <>
      {description ? (
        <FeatureDescription>{description}</FeatureDescription>
      ) : null}
      {hasBadges && (
        <BadgesWrap>
          <ClimbingBadges feature={feature} />
        </BadgesWrap>
      )}
      <FeatureHazardAlert feature={feature} />
    </>
  );
};

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
          const rawLength = route.feature.tags?.['climbing:length'];
          // OSM stores climbing:length as a bare number in meters by default;
          // append "m" only when there isn't already a non-digit suffix.
          const lengthDisplay = rawLength
            ? /^\d+(\.\d+)?$/.test(rawLength)
              ? `${rawLength} m`
              : rawLength
            : null;
          const isDrawn = route.paths
            ? Object.values(route.paths).some((p) => p && p.length > 0)
            : false;
          return (
            <tr key={`${route.id}-${displayNumber}`}>
              <NumCell>
                {/* Routes not drawn on a photo get just the bare number — no
                    rounded fill, no colour — keeping the same size, position
                    and font so the column stays aligned. */}
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: 22,
                    padding: '2px 6px',
                    fontSize: 12,
                    ...(isDrawn
                      ? { borderRadius: 10, background: color, color: '#fff' }
                      : {}),
                  }}
                >
                  {displayNumber}
                </span>
              </NumCell>
              <td>
                <RouteName
                  style={{
                    fontWeight: '900',
                    color: isDrawn ? '#000' : '#666',
                  }}
                >
                  {name}
                </RouteName>
                <RouteBadgesWrap>
                  <ClimbingBadges feature={route.feature} dense />
                </RouteBadgesWrap>
                {description ? (
                  <RouteDescription>{description}</RouteDescription>
                ) : null}
                {lengthDisplay ? (
                  <RouteLengthChip>{lengthDisplay}</RouteLengthChip>
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
  /** Draw protection markers (bolts, anchors…) on the photo. */
  showProtection: boolean;
  /** Hide the per-photo route table (e.g. when the only crag photo already
   * covers every route — the bottom "All routes" table is enough). */
  hideRoutesSummary?: boolean;
};

const PhotoExport = ({
  photoPath,
  dims,
  routes,
  protectionPoints,
  isTicked,
  ticks,
  showProtection,
  hideRoutesSummary,
}: PhotoExportProps) => {
  const { userSettings } = useUserSettingsContext();
  const gradesVisible = userSettings['climbing.isGradesOnPhotosVisible'];
  const selectedRouteSystem = userSettings['climbing.gradeSystem'];
  const imageUrl = getCommonsImageUrl(fileForPath(photoPath), 1920);
  // Use a reference dimension that reflects the *printed* width of the
  // photo, not just dims.w. Portrait photos are capped by `max-height: 22cm`
  // while landscape photos use a fixed page width (~19cm, see the SVG style
  // below). Without this, a portrait's badge/line ends up much smaller on
  // paper than a landscape's for the same nominal unit value. 0.86 ≈
  // 19cm / 22cm — the ratio at which the height cap starts to bite.
  const refDim = Math.max(dims.w, dims.h * 0.86);
  const unit = Math.max(2, refDim / 200); // base unit for stroke/text sizing
  // Route lines: ~20% thinner than the original visual default — they were
  // a bit too heavy on print.
  const strokeWidth = unit * 0.72;
  const borderWidth = strokeWidth * 1.7;
  // Markers from crag modal use coordinates in screen-pixel units. The PDF SVG
  // viewBox is at image-natural-pixel scale, so we need to scale markers up by
  // roughly the ratio of natural width to rendered print width.
  const markerScale = refDim / 700;

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

              {showProtection &&
                path.map((p, pi) => {
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

        {showProtection &&
          protectionPoints?.map((p, idx) =>
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
          // Match the in-dialog layout: when other routes share this start
          // point and grades are visible, the grade sits next to each badge
          // in a tight column; alone, it sits centered below the badge.
          const hasSiblings = routes.some((other, idx) => {
            if (idx === routeIndex) return false;
            const otherFirst = other?.paths?.[photoPath]?.[0];
            return (
              otherFirst && otherFirst.x === start.x && otherFirst.y === start.y
            );
          });
          const gradeBeside = hasSiblings && gradesVisible;
          const columnShiftRaw = gradeBeside ? 70 : 22;
          const rowHeightUserUnits = 18 * markerScale;
          const maxRowsPerColumn = Math.max(
            1,
            Math.floor(
              Math.max(0, dims.h - start.y * dims.h) / rowHeightUserUnits,
            ),
          );
          const shift = getShiftForStartPoint({
            currentRouteSelectedIndex: routeIndex,
            currentPosition: start,
            checkedRoutes: routes,
            photoPath,
            maxRowsPerColumn,
            rowShift: 18,
            columnShift: columnShiftRaw,
          });
          // Mirror columns to the left when the start point is close to the
          // right edge — matches the crag dialog so the grade text never
          // spills off the photo.
          const columnShiftPx = columnShiftRaw * markerScale;
          const startXpx = start.x * dims.w;
          const mirrorLeft = dims.w - startXpx < columnShiftPx;
          let cx = startXpx + (mirrorLeft ? -shift.x : shift.x) * markerScale;
          let cy = start.y * dims.h + shift.y * markerScale;

          // Badge geometry — must mirror RouteNumberBadge layout.
          const badgeDigits = String(routeIndex + 1).length;
          const badgeWidth =
            unit * (badgeDigits > 2 ? 5.5 + badgeDigits * 1.2 : 6);
          const badgeHeight = unit * 6;
          const badgeTopY0 = cy + unit * 2;
          const badgeOutlinePad = unit * 0.3;

          let gradeText: string | null = null;
          if (gradesVisible) {
            const difficulties = getDifficulties(route.feature?.tags);
            if (difficulties && difficulties.length > 0) {
              const { routeDifficulty } = findOrConvertRouteGrade(
                difficulties,
                selectedRouteSystem,
              );
              if (routeDifficulty?.grade) {
                gradeText = routeDifficulty.grade;
              }
            }
          }

          // Grade text geometry (relative to the un-clamped cx/cy).
          const gradeFontSize = unit * 3.5;
          const gradeBesideX = mirrorLeft
            ? cx - badgeWidth / 2 - unit * 1.5
            : cx + badgeWidth / 2 + unit * 1.5;
          const gradeBesideY = badgeTopY0 + badgeHeight / 2 + unit * 1.4;
          const gradeBelowX = cx;
          const gradeBelowY = badgeTopY0 + badgeHeight + unit * 4.5;
          const gradeX = gradeBeside ? gradeBesideX : gradeBelowX;
          const gradeY = gradeBeside ? gradeBesideY : gradeBelowY;
          const gradeAnchor: 'start' | 'middle' | 'end' = gradeBeside
            ? mirrorLeft
              ? 'end'
              : 'start'
            : 'middle';

          // Combined badge + grade bounding box, then a single shift if any
          // edge spills out of the photo — same approach as RouteNumber in
          // the crag dialog so the badge and its grade stay glued together.
          let boundLeft = cx - badgeWidth / 2 - badgeOutlinePad;
          let boundRight = cx + badgeWidth / 2 + badgeOutlinePad;
          let boundTop = badgeTopY0 - badgeOutlinePad;
          let boundBottom = badgeTopY0 + badgeHeight + badgeOutlinePad;
          if (gradeText) {
            const gradeHalfWidth = unit * 4; // generous half-width estimate
            const gradeFullWidth = gradeHalfWidth * 2;
            const gradeLeft =
              gradeAnchor === 'start'
                ? gradeX
                : gradeAnchor === 'end'
                  ? gradeX - gradeFullWidth
                  : gradeX - gradeHalfWidth;
            const gradeRight = gradeLeft + gradeFullWidth;
            const gradeTop = gradeY - gradeFontSize;
            const gradeBottom = gradeY + unit * 0.6;
            boundLeft = Math.min(boundLeft, gradeLeft);
            boundRight = Math.max(boundRight, gradeRight);
            boundTop = Math.min(boundTop, gradeTop);
            boundBottom = Math.max(boundBottom, gradeBottom);
          }
          let dx = 0;
          let dy = 0;
          if (boundLeft < 0) dx = -boundLeft;
          else if (boundRight > dims.w) dx = dims.w - boundRight;
          if (boundTop < 0) dy = -boundTop;
          else if (boundBottom > dims.h) dy = dims.h - boundBottom;
          cx += dx;
          cy += dy;
          const finalGradeX = gradeX + dx;
          const finalGradeY = gradeY + dy;

          return (
            <React.Fragment key={`num-${routeIndex}`}>
              <RouteNumberBadge
                routeNumber={routeIndex + 1}
                cx={cx}
                cy={cy}
                unit={unit}
                fill={strokeColor}
                isTicked={shortId ? isTicked(shortId) : false}
              />
              {gradeText && (
                <>
                  {/* Two text nodes — outline first, then fill — mirrors
                      the RouteDifficulty component used in the crag dialog
                      and avoids paint-order quirks in some SVG renderers. */}
                  <text
                    x={finalGradeX}
                    y={finalGradeY}
                    textAnchor={gradeAnchor}
                    fontFamily="Roboto, sans-serif"
                    fontWeight={700}
                    fontSize={gradeFontSize}
                    stroke="#fff"
                    strokeWidth={unit * 0.9}
                    strokeLinejoin="round"
                    fill="none"
                  >
                    {gradeText}
                  </text>
                  <text
                    x={finalGradeX}
                    y={finalGradeY}
                    textAnchor={gradeAnchor}
                    fontFamily="Roboto, sans-serif"
                    fontWeight={700}
                    fontSize={gradeFontSize}
                    fill={strokeColor}
                  >
                    {gradeText}
                  </text>
                </>
              )}
            </React.Fragment>
          );
        })}
      </svg>

      {!hideRoutesSummary && (
        <RoutesSummary items={photoRoutes} ticks={ticks} />
      )}
    </PhotoBlock>
  );
};

const formatCoord = (value: number) => value.toFixed(5);

const formatExportDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Kept short on purpose: 5-decimal coords (~1 m) and a raw comma instead of
// the encoded %2C and the /en locale, so the QR encodes fewer characters and
// stays simple enough to scan when printed small.
const buildMapyComUrl = (lon: number, lat: number) =>
  `https://mapy.com/turisticka?source=coor&id=${lon.toFixed(5)},${lat.toFixed(
    5,
  )}`;

// Small QR pointing at the feature's location on Mapy.com, shown to the right of
// crag/sector names. Low error correction keeps the module count down (simplest
// pattern, biggest modules) so it stays easy to scan even when printed small.
const MapyQr = ({
  lon,
  lat,
  size = 64,
}: {
  lon: number;
  lat: number;
  size?: number;
}) => (
  <a
    href={buildMapyComUrl(lon, lat)}
    target="_blank"
    rel="noopener noreferrer"
    title="Mapy.com"
    style={{ flex: '0 0 auto', lineHeight: 0, alignSelf: 'center' }}
  >
    <QRCodeSVG
      value={buildMapyComUrl(lon, lat)}
      size={size}
      level="L"
      marginSize={2}
      bgColor="#ffffff"
      fgColor="#000000"
    />
  </a>
);

const getFeatureTypeLabel = (feature: Feature) =>
  feature.tags?.climbing === 'area'
    ? t('climbingpanel.pdf_export_type_area')
    : t('climbingpanel.pdf_export_type_crag');

// Line 1: the name. Line 2: "type · route count · GPS" (GPS links to OSM, the
// type is the generic word "crag"/"area", not the specific name).
const FeatureInfoLine = ({
  feature,
  count,
  primary = false,
}: {
  feature: Feature;
  count: number;
  primary?: boolean;
}) => {
  const label = getLabel(feature);
  const [lon, lat] = feature.center ?? [];
  return (
    <InfoBlock>
      <FeatureName $primary={primary}>{label}</FeatureName>
      <InfoMeta>
        <span>{getFeatureTypeLabel(feature)}</span>
        <InfoSep>●</InfoSep>
        <span>{t('climbingpanel.pdf_export_routes_count', { count })}</span>
        {lat != null && lon != null && (
          <>
            <InfoSep>●</InfoSep>
            <InfoLink
              href={getFullOsmappLink(feature)}
              target="_blank"
              rel="noopener noreferrer"
            >
              GPS: {formatCoord(lat)}, {formatCoord(lon)}
            </InfoLink>
          </>
        )}
      </InfoMeta>
    </InfoBlock>
  );
};

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
  /** Draw protection markers (bolts, anchors…) on the photos. */
  showProtection: boolean;
};

const CragPdfSection = ({
  feature,
  dims,
  isTicked,
  ticks,
  showHeading,
  showProtection,
}: CragPdfSectionProps) => {
  const routes = useMemo(() => osmToClimbingRoutes(feature), [feature]);
  const label = getLabel(feature);

  const protectionPointsByPhoto = useMemo(
    () => parseProtectionPointsByPhoto(feature.tags),
    [feature.tags],
  );

  const photoPathsForExport = useMemo(
    () => getCragExportPhotoPaths(feature, routes),
    [feature, routes],
  );

  // If there's exactly one photo AND every route is drawn on it, the per-photo
  // table would be a copy of the bottom "All routes" table. Hide it then.
  const singlePhotoCoversAllRoutes =
    photoPathsForExport.length === 1 &&
    routes.length > 0 &&
    routes.every((r) => {
      const p = r.paths?.[photoPathsForExport[0]];
      return p && p.length > 0;
    });

  const center = feature.center;
  const [lon, lat] = center ?? [];

  return (
    <>
      {showHeading && (
        <>
          <CragSectionHeading>
            <FeatureInfoLine feature={feature} count={routes.length} />
            {lat != null && lon != null && <MapyQr lon={lon} lat={lat} />}
          </CragSectionHeading>
          <FeatureExtras feature={feature} />
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
            showProtection={showProtection}
            hideRoutesSummary={singlePhotoCoversAllRoutes}
          />
        );
      })}

      {photoPathsForExport.length > 1 && (
        <AllRoutesHeading>
          {t('climbingpanel.pdf_export_all_routes')}
          {showHeading ? ` (${label})` : ''}
        </AllRoutesHeading>
      )}
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
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const gradesVisible = userSettings['climbing.isGradesOnPhotosVisible'];

  // For climbing=area, iterate over its child crags; otherwise treat the
  // feature itself as a single crag. (feature can be null on the homepage.)
  const isArea = feature?.tags?.climbing === 'area';
  const crags: Feature[] = useMemo(() => {
    if (!feature) return [];
    return isArea
      ? (feature.memberFeatures ?? []).filter(
          (f) => f.tags?.climbing === 'crag',
        )
      : [feature];
  }, [feature, isArea]);

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

  const { dims, loading: imagesLoading } = useImageDims(allPhotoPaths);
  // The feature is still a skeleton until its member routes/photos finish
  // loading. Treat that as "not ready" too, so the user sees a spinner instead
  // of an empty export while the feature loads (the button can now be clicked
  // before the panel has finished loading).
  const loading = imagesLoading || !!feature?.skeleton;
  const [mapReady, setMapReady] = useState(false);

  // Export options (next to the Print button).
  const [showMap, setShowMap] = useState(true);
  const [showProtection, setShowProtection] = useState(true);
  // The PDF map is rendered from MapTiler basemap tiles, which we don't cache
  // for offline use — so skip it entirely when offline (blank tiles otherwise).
  const online = useOnlineStatus();
  const mapEnabled = showMap && online;
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    if (loading) setMapReady(false);
  }, [loading]);

  const center = feature?.center;
  const [lon, lat] = center ?? [];
  const generatedAt = useMemo(() => formatExportDateTime(new Date()), []);
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

  // Esc closes the overlay. Bound on keydown so it fires even while focus is
  // inside the print content (no native dialog backdrop catches it for us).
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Re-enabling the map needs a fresh capture, so reset the readiness gate.
  const toggleShowMap = () => {
    if (showMap) {
      setShowMap(false);
    } else {
      setMapReady(false);
      setShowMap(true);
    }
  };

  const handlePrint = () => {
    // In-page print: PrintStyles' @media print rules unlock body sizing
    // (overriding the global `body { position: fixed }`) so the browser can
    // paginate. Works on mobile too, where window.open + cross-window print
    // is unreliable.
    window.print();
  };

  if (!isOpen || !mounted || !feature) return null;

  return ReactDOM.createPortal(
    <Overlay className="pdf-export-overlay pdf-export-print-portal">
      <PrintStyles />
      <OverlayHeader className="pdf-no-print">
        <Typography variant="h6" sx={{ flex: 1 }}>
          {t('climbingpanel.pdf_export_title')}
        </Typography>
        <Tooltip title={t('climbingpanel.pdf_export_settings')}>
          <IconButton
            color="primary"
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
        >
          <MenuItem onClick={toggleShowMap} disabled={!online}>
            <ListItemIcon>
              <Checkbox edge="start" checked={mapEnabled} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText primary={t('climbingpanel.pdf_export_show_map')} />
          </MenuItem>
          <MenuItem onClick={() => setShowProtection((prev) => !prev)}>
            <ListItemIcon>
              <Checkbox edge="start" checked={showProtection} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText
              primary={t('climbingpanel.pdf_export_show_protection')}
            />
          </MenuItem>
          <MenuItem
            onClick={() =>
              setUserSetting('climbing.isGradesOnPhotosVisible', !gradesVisible)
            }
          >
            <ListItemIcon>
              <Checkbox edge="start" checked={!!gradesVisible} tabIndex={-1} />
            </ListItemIcon>
            <ListItemText primary={t('climbingpanel.pdf_export_show_grades')} />
          </MenuItem>
          <MenuItem disableRipple sx={{ cursor: 'default', gap: 1 }}>
            <ListItemText primary={t('user_settings.default_grade_system')} />
            <GradeSystemSelect />
          </MenuItem>
        </Menu>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={loading || (mapEnabled && !mapReady)}
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
            <Masthead>
              <BrandRight>
                <BrandLogoWrap>
                  <LogoOpenClimbing width={20} />
                </BrandLogoWrap>
                <BrandText>openclimbing.org</BrandText>
              </BrandRight>
              <GuideTitle>{t('climbingpanel.pdf_export_heading')}</GuideTitle>
            </Masthead>
            <TitleRow>
              <FeatureInfoLine
                feature={feature}
                count={totalRoutesCount}
                primary
              />
              {lat != null && lon != null && (
                <MapyQr lon={lon} lat={lat} size={60} />
              )}
            </TitleRow>
          </BrandHeader>

          <FeatureExtras feature={feature} />

          {mapEnabled && !loading && (
            <ClimbingPdfExportMap
              feature={feature}
              crags={crags}
              isArea={isArea}
              onReady={setMapReady}
            />
          )}

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
                showProtection={showProtection}
              />
            ))
          )}

          <Footer>
            <span
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: t('climbingpanel.pdf_export_footer'),
              }}
            />
            <div>
              {t('climbingpanel.pdf_export_generated_at', {
                datetime: generatedAt,
              })}
            </div>
          </Footer>
        </PrintRoot>
      </OverlayScroll>
    </Overlay>,
    document.body,
  );
};
