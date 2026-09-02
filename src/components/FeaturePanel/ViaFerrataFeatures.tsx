import React from 'react';
import styled from '@emotion/styled';
import { useFeatureContext } from '../utils/FeatureContext';
import { t } from '../../services/intl';

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const Badge = styled.span`
  font-size: 13px;
  background: ${({ theme }) => theme.palette.action.hover};
  padding: 2px 8px;
  border-radius: 12px;
`;

export const ViaFerrataFeatures = () => {
  const { feature } = useFeatureContext();
  const { tags } = feature;

  if (tags.highway !== 'via_ferrata' && tags.route !== 'via_ferrata') {
    return null;
  }

  const features: { icon: string; label: string }[] = [];

  if (tags.bridge && tags.bridge !== 'no') {
    features.push({ icon: '🌉', label: t('featurepanel.via_ferrata.bridge') });
  }
  if ((tags.ladder && tags.ladder !== 'no') || tags['ladder:length']) {
    features.push({ icon: '🪜', label: t('featurepanel.via_ferrata.ladder') });
  }
  if (tags.aerialway === 'zip_line') {
    features.push({
      icon: '🪂',
      label: t('featurepanel.via_ferrata.zip_line'),
    });
  }
  if (tags.net && tags.net !== 'no') {
    features.push({ icon: '🕸️', label: t('featurepanel.via_ferrata.net') });
  }

  const cableCount = parseInt(tags.cable || '0', 10);
  if (cableCount >= 2) {
    features.push({
      icon: '🔗',
      label: t('featurepanel.via_ferrata.cables', { count: cableCount }),
    });
  }

  if (features.length === 0) {
    return null;
  }

  return (
    <Container>
      {features.map(({ icon, label }) => (
        <Badge key={label}>
          {icon} {label}
        </Badge>
      ))}
    </Container>
  );
};
