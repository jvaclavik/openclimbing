import styled from '@emotion/styled';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { IconButton, Tooltip } from '@mui/material';
import React from 'react';
import { t } from '../../services/intl';
import { convertHexToRgba } from './colorUtils';

type ClosePanelButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  right?: boolean;
  style?: React.CSSProperties;
};

const Button = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== '$floating',
})<{ $floating?: boolean }>`
  width: 36px;
  height: 36px;
  padding: 0;
  color: ${({ theme }) => theme.palette.text.primary};
  background: ${({ theme }) =>
    convertHexToRgba(theme.palette.background.paper, 0.72)};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 6px 18px rgba(0, 0, 0, 0.14);

  ${({ $floating }) =>
    $floating &&
    `
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 7;
  `}

  &:hover {
    background: ${({ theme }) => theme.palette.background.paper};
  }
`;

export const ClosePanelButton = ({
  onClick,
  right = false,
  style,
}: ClosePanelButtonProps) => (
  <Tooltip title={t('close_panel')}>
    <Button
      $floating={right}
      aria-label={t('close_panel')}
      onClick={onClick}
      style={style}
      size="small"
    >
      <CloseRoundedIcon fontSize="small" />
    </Button>
  </Tooltip>
);
