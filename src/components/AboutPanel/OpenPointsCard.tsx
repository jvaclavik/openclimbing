import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import { Stack, Typography } from '@mui/material';
import React from 'react';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { TintedCard } from '../utils/panelUi';

const US_POINTS = ['1', '2', '3'] as const;

const Card = styled(TintedCard)`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.palette.primary.main};
`;

const Point = ({ children }: { children: React.ReactNode }) => (
  <Stack
    direction="row"
    spacing={1.25}
    sx={{
      alignItems: 'flex-start',
      mt: 1,
    }}
  >
    <CheckIcon color="primary" sx={{ fontSize: 20, mt: '1px' }} />
    <Typography
      variant="body2"
      sx={{
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      {children}
    </Typography>
  </Stack>
);

export const OpenPointsCard = ({
  children,
}: {
  children?: React.ReactNode;
}) => (
  <Card>
    <Typography
      variant="caption"
      component="h3"
      sx={{
        color: 'text.primary',
        fontWeight: 700,
      }}
    >
      {t('about.different_us')}
    </Typography>
    {US_POINTS.map((index) => (
      <Point key={index}>
        {t(`about.compare_us_${index}` as TranslationId)}
      </Point>
    ))}
    {children}
  </Card>
);
