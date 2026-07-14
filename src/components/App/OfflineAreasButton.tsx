import React from 'react';
import Router from 'next/router';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Typography, Tooltip } from '@mui/material';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import { intl, t } from '../../services/intl';
import { useMobileMode } from '../helpers';
import { convertHexToRgba } from '../utils/colorUtils';
import { useOnlineStatus } from '../../services/offline/useOnlineStatus';
import { usePanelShown } from '../utils/usePanelShown';

// Styled to match the "Layers/Mapy" LayerSwitcherButton pill.
const StyledButton = styled.button<{ $isMobileMode: boolean }>`
  margin: 0;
  padding: 2px 20px 2px 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-direction: row;
  pointer-events: all;
  ${({ $isMobileMode }) =>
    $isMobileMode
      ? css`
          width: 44px;
          height: 44px;
          border-radius: 50%;
          padding: 0;
        `
      : css`
          border-radius: 40px;
        `}

  border: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  background-color: ${({ theme }) =>
    convertHexToRgba(theme.palette.background.paper, 0.8)};
  backdrop-filter: blur(15px);
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.primary};
  outline: 0;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }

  svg {
    margin: 4px auto 4px auto;
  }
`;

// Shortcut to the downloaded areas, shown under the search only while offline.
// Hidden when a panel is open so it never sits over the feature panel.
export const OfflineAreasButton = () => {
  const online = useOnlineStatus();
  const panelShown = usePanelShown();
  const isMobileMode = useMobileMode();

  if (online || panelShown) return null;

  return (
    <Tooltip title={isMobileMode ? t('offline.menu_link') : null} arrow>
      <StyledButton
        $isMobileMode={isMobileMode}
        onClick={() =>
          Router.push('/offline', undefined, { locale: intl.lang })
        }
      >
        <DownloadForOfflineIcon />
        {!isMobileMode && (
          <Typography variant="button">{t('offline.menu_link')}</Typography>
        )}
      </StyledButton>
    </Tooltip>
  );
};
