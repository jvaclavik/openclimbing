import {
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import React from 'react';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';
import { useMobileMode } from '../helpers';
import { useUserThemeContext, UserTheme } from '../../helpers/theme';

type Props = {
  onClose: (event: unknown) => void;
  isOpened: boolean;
};

const Appearance = () => {
  const { userTheme, setUserTheme } = useUserThemeContext();

  return (
    <ListItem>
      <ListItemText
        primary="Erscheinungsbild"
        secondary="Hell, dunkel oder so wie das Gerät"
      />
      <Select
        size="small"
        value={userTheme}
        onChange={(event) => setUserTheme(event.target.value as UserTheme)}
      >
        <MenuItem value="light">Hell</MenuItem>
        <MenuItem value="dark">Dunkel</MenuItem>
        <MenuItem value="system">Automatisch</MenuItem>
      </Select>
    </ListItem>
  );
};

export const UserSettingsDialog = ({ onClose, isOpened }: Props) => {
  const { setUserSetting, userSettings } = useUserSettingsContext();
  const isMobileMode = useMobileMode();

  return (
    <Dialog
      onClose={onClose}
      open={isOpened}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobileMode}
    >
      <DialogTitle>Einstellungen</DialogTitle>
      <ClosePanelButton right onClick={onClose} />
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Nur das, was ihr auf der Karte wirklich braucht. Filter und Listen
          merkt sich dieses Gerät von selbst.
        </Typography>
        <List>
          <Appearance />
          <ListItem>
            <ListItemText
              primary="Entfernungen in Meilen"
              secondary="Sonst Kilometer und Meter"
            />
            <Switch
              color="primary"
              edge="end"
              onChange={(event) =>
                setUserSetting('isImperial', event.target.checked)
              }
              checked={userSettings.isImperial}
            />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
};
