import React, { useCallback, useEffect, useRef } from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { useUserSettingsContext } from './userSettings/UserSettingsContext';
import { useSnackbar } from './SnackbarContext';
import { isTypingInFormField } from '../../helpers/hooks';
import { DEBUG_SETTINGS_KEY } from './debugStorage';

export { DEBUG_SETTINGS_KEY, isDebugModeEnabled } from './debugStorage';

const REQUIRED_CLICKS = 6;
const CLICK_RESET_MS = 1500;

export const useDebugMode = () => {
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const debugMode = userSettings[DEBUG_SETTINGS_KEY] ?? false;
  const setDebugMode = (value: boolean) =>
    setUserSetting(DEBUG_SETTINGS_KEY, value);
  return { debugMode, setDebugMode };
};

const showDebugToast = (
  showToast: ReturnType<typeof useSnackbar>['showToast'],
  enabled: boolean,
  hint?: string,
) => {
  showToast(
    `${enabled ? 'Debug mode zapnut' : 'Debug mode vypnut'}${hint ? ` (${hint})` : ''}`,
    enabled ? 'success' : 'info',
  );
};

/**
 * Wraps any element so that clicking it 6 times (within a short window) toggles
 * debug mode. Used as the single, unified way to turn debug mode on/off.
 */
export const DebugModeActivator = ({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) => {
  const { debugMode, setDebugMode } = useDebugMode();
  const { showToast } = useSnackbar();
  const clickCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const handleClick = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);

    clickCountRef.current += 1;
    const remaining = REQUIRED_CLICKS - clickCountRef.current;

    if (clickCountRef.current >= REQUIRED_CLICKS) {
      clickCountRef.current = 0;
      const next = !debugMode;
      setDebugMode(next);
      showDebugToast(showToast, next);
      return;
    }
    if (clickCountRef.current >= 3) {
      showToast(`Debug mode: ještě ${remaining}×`, 'info');
    }
    timerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, CLICK_RESET_MS);
  }, [debugMode, setDebugMode, showToast]);

  return (
    <Box component="span" onClick={handleClick} sx={sx}>
      {children}
    </Box>
  );
};

const SHORTCUT_HINT = 'Ctrl+Shift+D';

/** Keyboard shortcut (Ctrl+Shift+D) to toggle debug mode from anywhere. */
const useDebugModeShortcut = () => {
  const { debugMode, setDebugMode } = useDebugMode();
  const { showToast } = useSnackbar();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTypingInFormField(e.target)) return;
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        const next = !debugMode;
        setDebugMode(next);
        showDebugToast(showToast, next, SHORTCUT_HINT);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [debugMode, setDebugMode, showToast]);
};

export const DebugModeManager = () => {
  useDebugModeShortcut();
  return null;
};
