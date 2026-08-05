import styled from '@emotion/styled';
import PolylineIcon from '@mui/icons-material/Polyline';
import React from 'react';
import { t } from '../../../../services/intl';
import { ImageDef, isTag } from '../../../../services/types';

// Legibility backdrop for the badge and the info button sitting in the corners.
export const PhotoShade = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(0deg, rgba(0, 0, 0, 0.35) 0%, transparent 28%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, transparent 25%);
`;

const Badge = styled.div`
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px 2px 5px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
`;

// same reveal-on-hover pattern as the homepage gallery tiles
export const HoverAction = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  padding: 4px 10px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
`;

export const getDrawnRoutesCount = (def: ImageDef) => {
  if (!isTag(def)) {
    return 0;
  }
  return (def.path?.length ? 1 : 0) + (def.memberPaths?.length ?? 0);
};

// A bare count next to the polyline glyph – spelling out "routes" would need
// plural rules the translation layer doesn't have.
export const DrawnRoutesBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <Badge title={t('featurepanel.drawn_routes', { count: `${count}` })}>
      <PolylineIcon sx={{ fontSize: 13 }} />
      {count}
    </Badge>
  ) : null;
