import React from 'react';
import styled from '@emotion/styled';
import { useFeatureContext } from '../../utils/FeatureContext';
import { t } from '../../../services/intl';

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
    return <Container>🆓 {t('featurepanel.fee.free_access')}</Container>;
  }

  return (
    <Container>
      💶{' '}
      {charge
        ? t('featurepanel.fee.charge_amount', { amount: charge })
        : t('featurepanel.fee.required')}
    </Container>
  );
};
