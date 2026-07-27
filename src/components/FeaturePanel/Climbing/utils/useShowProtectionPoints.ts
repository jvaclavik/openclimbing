import { useSmallScreen } from '../../../helpers';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

// Effective visibility of the protection (gear) points overlay.
// Default: hidden on very small screens, visible otherwise. An explicit
// user setting (climbing.showProtectionPoints) always wins.
export const useShowProtectionPoints = () => {
  const { userSettings } = useUserSettingsContext();
  const isSmallScreen = useSmallScreen();
  const setting = userSettings['climbing.showProtectionPoints'];
  return setting ?? !isSmallScreen;
};
