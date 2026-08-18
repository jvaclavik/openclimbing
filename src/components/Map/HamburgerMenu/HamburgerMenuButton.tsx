import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import React from 'react';
import styled from '@emotion/styled';
import { LoginIconButton } from './LoginIconButton';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { useMobileMode } from '../../helpers';
import { convertHexToRgba } from '../../utils/colorUtils';

// match maplibre ctrl-group buttons (geolocate / compass) so top-bar actions
// stay readable on the map
const mapControlButtonCss = ({ theme }) => `
  width: 44px;
  height: 44px;
  padding: 0;
  background: ${convertHexToRgba(theme.palette.background.paper, 0.8)};
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);

  &:hover {
    background: ${theme.palette.background.paper};
  }
`;

const UserIconButton = styled(IconButton)`
  ${mapControlButtonCss}
  padding: 4px;
`;

const MenuIconButton = styled(IconButton)`
  ${mapControlButtonCss}

  svg {
    fill: ${({ theme }) => theme.palette.text.primary};
  }
`;

export const HamburgerMenuButton = ({ anchorRef, onClick }) => {
  const { osmUser } = useOsmAuthContext();
  const isMobileMode = useMobileMode();

  if (osmUser) {
    return (
      <UserIconButton ref={anchorRef} color="primary" onClick={onClick}>
        <LoginIconButton size={isMobileMode ? 32 : 36} />
      </UserIconButton>
    );
  }

  return (
    <MenuIconButton ref={anchorRef} color="primary" onClick={onClick}>
      <MenuIcon />
    </MenuIconButton>
  );
};
