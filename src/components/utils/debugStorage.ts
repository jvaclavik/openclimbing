// Pure, dependency-free reader of the persisted debug flag, so it can be used
// from lightweight/vanilla contexts (e.g. crashOverlay) without pulling React.

export const DEBUG_SETTINGS_KEY = 'debug.enabled';

export const isDebugModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('userSettings');
    const settings = raw ? JSON.parse(raw) : null;
    return settings?.[DEBUG_SETTINGS_KEY] === true;
  } catch {
    return false;
  }
};
