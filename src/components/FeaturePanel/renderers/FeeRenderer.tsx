import React from 'react';
import styled from '@emotion/styled';
import { useFeatureContext } from '../../utils/FeatureContext';

const Container = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
`;

export const FeeRenderer = ({ k, v }) => {
  const { feature } = useFeatureContext();
  const charge = feature?.tags?.charge;

  if (v === 'no') {
    return <Container>🆓 Free access</Container>;
  }

  return (
    <Container>💶 {charge ? `${charge} fee` : 'Entrance fee required'}</Container>
  );
};
