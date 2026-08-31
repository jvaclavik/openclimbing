import Router from 'next/router';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { t } from '../../../services/intl';
import React from 'react';
import PersonIcon from '@mui/icons-material/Person';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { profilePathForOsmDisplayName } from '../../../services/my-ticks/profilePaths';
import { isModifiedClick } from '../../helpers';

type MyClimbingProfileMenuItemProps = {
  closeMenu: () => void;
};

export const MyClimbingProfileMenuItem = ({
  closeMenu,
}: MyClimbingProfileMenuItemProps) => {
  const { loggedIn, osmUser } = useOsmAuthContext();

  if (!loggedIn || !osmUser) {
    return null;
  }

  const profileHref = profilePathForOsmDisplayName(osmUser);

  const openProfile = (e: React.MouseEvent) => {
    if (isModifiedClick(e)) return;
    e.preventDefault();
    Router.push(profileHref);
    closeMenu();
  };

  return (
    <ListItemButton component="a" href={profileHref} onClick={openProfile}>
      <ListItemIcon>
        <PersonIcon />
      </ListItemIcon>
      <ListItemText>{t('user.my_climbing_profile')}</ListItemText>
    </ListItemButton>
  );
};
