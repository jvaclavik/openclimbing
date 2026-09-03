import React from 'react';
import styled from '@emotion/styled';
import { t } from '../../../services/intl';
import {
  getViaFerrataGrades,
  VIA_FERRATA_SCALE_COLORS,
} from '../../../services/tagging/viaFerrataScale';

const Container = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const Circle = styled.div<{ $color: string }>`
  border-radius: 12px;
  padding: 2px 8px;
  background-color: ${({ $color }) => $color};
  display: inline-block;
  font-size: 13px;
  font-weight: 900;
  color: ${({ theme, $color }) => theme.palette.getContrastText($color)};
  font-family: monospace;
`;

const GradeDetail = styled.span`
  font-size: 12px;
  opacity: 0.8;
`;

// TODO perhaps merge with ClimbingGradeRenderer in future
export const ScaleRenderer = ({ k, v }) => {
  const label =
    k === 'via_ferrata_scale'
      ? t('climbing_renderer.via_ferrata_scale')
      : k === 'sac_scale'
        ? t('climbing_renderer.sac_scale')
        : k;

  const color =
    k === 'via_ferrata_scale'
      ? (VIA_FERRATA_SCALE_COLORS[v] ?? '#555')
      : '#555';

  const grades = k === 'via_ferrata_scale' ? getViaFerrataGrades(v) : null;

  return (
    <Container>
      <Circle $color={color}>{v}</Circle>
      <span>{label}</span>
      {grades && (
        <GradeDetail>
          ({grades.french} / {grades.german})
        </GradeDetail>
      )}
    </Container>
  );
};
