import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

// Effective visibility of the protection (gear) points overlay.
// Shown by default on every screen size; an explicit user setting
// (climbing.showProtectionPoints) always wins.
export const useShowProtectionPoints = () => {
  const { userSettings } = useUserSettingsContext();
  const setting = userSettings['climbing.showProtectionPoints'];
  return setting ?? true;
};
