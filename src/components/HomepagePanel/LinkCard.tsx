import styled from '@emotion/styled';
import { Stack, Typography } from '@mui/material';
import React, { ReactNode } from 'react';

// the panel itself is `background.paper`, so the card needs to stand out by a tint
export const LinkCard = styled.div`
  overflow: hidden;
  border-radius: 12px;
  background-color: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.03)'};
`;

export const CardRow = styled.div`
  padding: 16px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.palette.background.default};
  }
`;

const IconSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 22px;
  line-height: 1;
`;

type CardTitleProps = {
  icon: ReactNode;
  children: ReactNode;
};

export const CardTitle = ({ icon, children }: CardTitleProps) => (
  <Stack
    direction="row"
    spacing={1.5}
    sx={{
      alignItems: 'center',
      mb: 1,
    }}
  >
    <IconSlot>{icon}</IconSlot>
    <Typography
      variant="subtitle2"
      component="h3"
      sx={{
        fontWeight: 700,
      }}
    >
      {children}
    </Typography>
  </Stack>
);

type LinkRowProps = CardTitleProps & {
  title: string;
};

export const LinkRow = ({ icon, title, children }: LinkRowProps) => (
  <CardRow>
    <CardTitle icon={icon}>{title}</CardTitle>
    <Typography
      variant="body2"
      component="div"
      sx={{
        color: 'text.secondary',
      }}
    >
      {children}
    </Typography>
  </CardRow>
);
