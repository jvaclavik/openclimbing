import React from 'react';
import { Box, Stack } from '@mui/material';
import {
  Addition,
  InnerContainer,
  Title,
} from '../FeaturePanel/Climbing/PanelLabel';

/**
 * Section of the climbing profile. Same header as other panels (PanelLabel):
 * small uppercase title, optional control on the right.
 */
export const ProfileSection = ({
  title,
  addition,
  children,
  gap = 1.25,
}: {
  title: React.ReactNode;
  addition?: React.ReactNode;
  children: React.ReactNode;
  gap?: number;
}) => (
  <Stack component="section" spacing={gap}>
    <InnerContainer>
      <Title>{title}</Title>
      {addition ? <Addition>{addition}</Addition> : null}
    </InnerContainer>
    <Box>{children}</Box>
  </Stack>
);
