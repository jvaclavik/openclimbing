import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import React from 'react';
import { t } from '../../services/intl';
import {
  describeViaFerrataScale,
  getViaFerrataScaleRangeColor,
  isViaFerrataTags,
  resolveViaFerrataScale,
  VIA_FERRATA_LINE_COLOR,
} from '../../services/tagging/viaFerrataScale';
import { useFeatureContext } from '../utils/FeatureContext';

const transient = {
  shouldForwardProp: (prop: PropertyKey) =>
    typeof prop !== 'string' || !prop.startsWith('$'),
};

const Row = styled('div', transient)<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $compact }) => ($compact ? 8 : 12)}px;
  margin: ${({ $compact }) => ($compact ? '6px 0 2px' : '4px 0 12px')};
`;

const Letter = styled('div', transient)<{ $color: string; $compact?: boolean }>`
  min-width: ${({ $compact }) => ($compact ? 36 : 52)}px;
  height: ${({ $compact }) => ($compact ? 36 : 52)}px;
  padding: 0 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color }) => $color};
  color: ${({ theme, $color }) => theme.palette.getContrastText($color)};
  font-family: ${({ theme }) => theme.typography.h1.fontFamily};
  font-weight: 700;
  font-size: ${({ $compact }) => ($compact ? 18 : 26)}px;
  line-height: 1;
  letter-spacing: -0.03em;
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Title = styled('div', transient)<{ $compact?: boolean }>`
  font-weight: 800;
  font-size: ${({ $compact }) => ($compact ? 13 : 15)}px;
  line-height: 1.2;
`;

const Detail = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

type Props = { compact?: boolean };

export const ViaFerrataGrade = ({ compact }: Props) => {
  const theme = useTheme();
  const { feature } = useFeatureContext();
  const tags = feature?.tags;
  if (!isViaFerrataTags(tags)) return null;

  const scale = resolveViaFerrataScale(
    tags,
    (feature.memberFeatures ?? []).map(
      (member) => member.tags?.via_ferrata_scale,
    ),
  );
  const described = scale ? describeViaFerrataScale(scale) : undefined;
  const color = scale
    ? (getViaFerrataScaleRangeColor(scale, theme.palette.mode) ??
      VIA_FERRATA_LINE_COLOR)
    : VIA_FERRATA_LINE_COLOR;

  const caption = described?.veryEasy
    ? t('via_ferrata.very_easy')
    : t('via_ferrata.huesler');

  return (
    <Row $compact={compact}>
      <Letter $color={color} $compact={compact} aria-hidden>
        {described?.letter ?? '–'}
      </Letter>
      <Copy>
        <Title $compact={compact}>
          {described
            ? `${t('via_ferrata.difficulty')} · ${caption}`
            : t('via_ferrata.unknown_grade')}
        </Title>
        {described && !compact && (
          <Detail>
            {t('via_ferrata.schall')} {described.schall}
            {' · '}
            {described.french}
            {described.german ? ` · ${described.german}` : ''}
          </Detail>
        )}
      </Copy>
    </Row>
  );
};
