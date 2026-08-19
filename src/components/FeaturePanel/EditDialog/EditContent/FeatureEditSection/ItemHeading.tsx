import { Stack, Typography } from '@mui/material';
import React from 'react';
import styled from '@emotion/styled';
import { useCurrentItem } from '../../context/EditContext';
import { OsmTypeLabel } from '../../../OsmTypeLabel';

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $deleted: boolean }>`
  ${({ $deleted }) => $deleted && 'text-decoration: line-through;'}
`;

export const ItemHeading = () => {
  const { shortId, tags, presetLabel, toBeDeleted } = useCurrentItem();

  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        mb: 2,
      }}
    >
      <StyledTypography variant="h6" $deleted={toBeDeleted}>
        {tags.name || presetLabel || ' '}
      </StyledTypography>
      <OsmTypeLabel shortId={shortId} />
    </Stack>
  );
};
