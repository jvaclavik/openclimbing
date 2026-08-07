import React from 'react';
import Link from 'next/link';
import {
  Avatar,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  styled,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { t } from '../../../services/intl';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { LoginIconButton } from './LoginIconButton';
import { UserSettingsItem } from './UserSettingsItem';
import { DebugModeActivator } from '../../utils/debug';
import { PROJECT_ID } from '../../../services/project';
import { profilePathForOsmDisplayName } from '../../../services/my-ticks/profilePaths';

type UserLoginProps = {
  closeMenu: () => void;
  openUserSettings: () => void;
};

const HeaderIcons = (props: {
  onClick: () => void;
  openUserSettings: () => void;
}) => (
  <Stack direction="row">
    <UserSettingsItem openUserSettings={props.openUserSettings} />
    <IconButton onClick={props.onClick}>
      <CloseIcon />
    </IconButton>
  </Stack>
);

const StyleLogoutText = styled(Typography)`
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;
const LogoutButton = ({ onClick }: { onClick: () => void }) => (
  <StyleLogoutText // TODO make it a Button for accessibility
    variant="caption"
    onClick={onClick}
    textTransform="lowercase"
    color="text.secondary"
    sx={{ cursor: 'pointer' }}
  >
    {t('user.logout')}
  </StyleLogoutText>
);

const StyleUserLink = styled('a')`
  color: ${({ theme }) => theme.palette.text.primary};
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const OsmUserLink = ({
  osmUser,
  onClose,
}: {
  osmUser: string;
  onClose: () => void;
}) => {
  if (PROJECT_ID === 'openclimbing') {
    return (
      <Typography
        component={Link}
        href={profilePathForOsmDisplayName(osmUser)}
        onClick={onClose}
        variant="body1"
        sx={{
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'text.primary',
          textDecoration: 'none',
          display: 'block',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        {osmUser}
      </Typography>
    );
  }
  return (
    <StyleUserLink
      href={`https://www.openstreetmap.org/user/${encodeURIComponent(osmUser)}`}
      target="_blank"
      rel="noopener"
      color="text.primary"
      variant="body1"
    >
      {osmUser}
    </StyleUserLink>
  );
};

type HeaderProps = {
  onClose: () => void;
  openUserSettings: () => void;
};

const LoggedUserHeader = ({ onClose, openUserSettings }: HeaderProps) => {
  const { osmUser, handleLogout } = useOsmAuthContext();

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      gap={1}
      alignItems="center"
      m={1}
      mt={2}
      mb={2}
    >
      <Stack direction="row" gap={1.5} alignItems="center" ml={0.5}>
        <DebugModeActivator sx={{ display: 'inline-flex' }}>
          <LoginIconButton size={32} />
        </DebugModeActivator>
        <Stack direction="column" justifyContent="center">
          <OsmUserLink osmUser={osmUser} onClose={onClose} />
          <LogoutButton onClick={handleLogout} />
        </Stack>
      </Stack>
      <HeaderIcons onClick={onClose} openUserSettings={openUserSettings} />
    </Stack>
  );
};

const LoggedOutUserHeader = ({ onClose, openUserSettings }: HeaderProps) => {
  const { handleLogin } = useOsmAuthContext();

  return (
    <Stack
      direction="row"
      gap={1}
      alignItems="center"
      justifyContent="space-between"
      mt={1}
    >
      <MenuItem onClick={handleLogin}>
        <ListItemIcon>
          <Avatar sx={{ width: 24, height: 24 }} />
        </ListItemIcon>
        <ListItemText>{t('user.login_register')}</ListItemText>
      </MenuItem>
      <HeaderIcons onClick={onClose} openUserSettings={openUserSettings} />
    </Stack>
  );
};

export const UserHeader = ({ closeMenu, openUserSettings }: UserLoginProps) => {
  const { osmUser } = useOsmAuthContext();
  if (osmUser) {
    return (
      <LoggedUserHeader
        onClose={closeMenu}
        openUserSettings={openUserSettings}
      />
    );
  }

  return (
    <LoggedOutUserHeader
      onClose={closeMenu}
      openUserSettings={openUserSettings}
    />
  );
};
UserHeader.displayName = 'UserHeader';
