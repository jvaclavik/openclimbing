import React from 'react';
import styled from '@emotion/styled';
import { useFeatureContext } from '../utils/FeatureContext';

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

const FeeContainer = styled.div`
  font-size: 13px;
  margin-bottom: 8px;
`;

/**
 * Displays via ferrata equipment features (bridges, ladders, zip lines, nets)
 * and entrance fee information when available in OSM tags.
 */
export const ViaFerrataFeatures = () => {
  const { feature } = useFeatureContext();
  const { tags } = feature;

  if (tags.highway !== 'via_ferrata' && tags.route !== 'via_ferrata') {
    return null;
  }

  const features: { icon: string; label: string; count: number }[] = [];

  const bridgeCount = parseInt(tags['bridge:count'] || '0', 10);
  const ladderCount = parseInt(tags['ladder:count'] || '0', 10);
  const zipLineCount = parseInt(tags['zip_line:count'] || '0', 10);
  const netCount = parseInt(tags['net:count'] || '0', 10);

  if (bridgeCount > 0)
    features.push({ icon: '🌉', label: 'bridges', count: bridgeCount });
  if (ladderCount > 0)
    features.push({ icon: '🪜', label: 'ladders', count: ladderCount });
  if (zipLineCount > 0)
    features.push({ icon: '🪂', label: 'zip lines', count: zipLineCount });
  if (netCount > 0)
    features.push({ icon: '𓈈', label: 'nets', count: netCount });

  const hasFee = tags.fee === 'yes';
  const charge = tags.charge;

  if (features.length === 0 && !hasFee) {
    return null;
  }

  return (
    <>
      {features.length > 0 && (
        <Container>
          {features.map(({ icon, label, count }) => (
            <Badge key={label}>
              {icon} {count} {label}
            </Badge>
          ))}
        </Container>
      )}
      {hasFee && (
        <FeeContainer>
          💶 {charge ? `${charge} fee` : 'Entrance fee required'}
        </FeeContainer>
      )}
    </>
  );
};
