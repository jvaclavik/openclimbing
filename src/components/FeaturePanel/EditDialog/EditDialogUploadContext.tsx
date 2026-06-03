import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSnackbar } from '../../utils/SnackbarContext';

const DEBUG_STORAGE_KEY = 'openclimbingUploadDebugMode';
const CLICK_RESET_MS = 1500;
const REQUIRED_CLICKS = 5;

type UploadRequest = {
  initialFile: File | null;
  /** Specific slot key to fill (e.g. wikimedia_commons:2). When omitted, the next free slot is used. */
  targetSlotKey: string | null;
};

type EditDialogUploadContextType = {
  debugMode: boolean;
  registerTitleClick: () => void;
  uploadRequest: UploadRequest | null;
  openUpload: (req?: Partial<UploadRequest>) => void;
  closeUpload: () => void;
  maximized: boolean;
  toggleMaximized: () => void;
};

const EditDialogUploadContext = createContext<
  EditDialogUploadContextType | undefined
>(undefined);

const readInitialDebugMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEBUG_STORAGE_KEY) === '1';
};

const writeDebugMode = (value: boolean) => {
  if (typeof window === 'undefined') return;
  if (value) {
    localStorage.setItem(DEBUG_STORAGE_KEY, '1');
  } else {
    localStorage.removeItem(DEBUG_STORAGE_KEY);
  }
};

export const EditDialogUploadProvider: React.FC = ({ children }) => {
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [uploadRequest, setUploadRequest] = useState<UploadRequest | null>(
    null,
  );
  const [maximized, setMaximized] = useState<boolean>(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);
  const { showToast } = useSnackbar();

  const toggleMaximized = useCallback(() => setMaximized((m) => !m), []);

  useEffect(() => {
    setDebugMode(readInitialDebugMode());
  }, []);

  const registerTitleClick = useCallback(() => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }
    clickCountRef.current += 1;
    const remaining = REQUIRED_CLICKS - clickCountRef.current;
    if (clickCountRef.current >= REQUIRED_CLICKS) {
      clickCountRef.current = 0;
      setDebugMode((prev) => {
        const next = !prev;
        writeDebugMode(next);
        showToast(
          next
            ? 'Photo upload (debug) enabled'
            : 'Photo upload (debug) disabled',
          'info',
        );
        return next;
      });
      return;
    }
    if (clickCountRef.current >= 3) {
      showToast(
        `${remaining} more click${remaining === 1 ? '' : 's'} to toggle photo upload (debug)`,
        'info',
      );
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, CLICK_RESET_MS);
  }, [showToast]);

  const openUpload = useCallback((req?: Partial<UploadRequest>) => {
    setUploadRequest({
      initialFile: req?.initialFile ?? null,
      targetSlotKey: req?.targetSlotKey ?? null,
    });
  }, []);

  const closeUpload = useCallback(() => setUploadRequest(null), []);

  return (
    <EditDialogUploadContext.Provider
      value={{
        debugMode,
        registerTitleClick,
        uploadRequest,
        openUpload,
        closeUpload,
        maximized,
        toggleMaximized,
      }}
    >
      {children}
    </EditDialogUploadContext.Provider>
  );
};

export const useEditDialogUploadContext = () => {
  const ctx = useContext(EditDialogUploadContext);
  if (!ctx) {
    throw new Error(
      'useEditDialogUploadContext must be used inside EditDialogUploadProvider',
    );
  }
  return ctx;
};

/**
 * Same as the strict version but returns undefined if the provider isn't mounted,
 * so leaf components that may render outside the EditDialog don't crash.
 */
export const useOptionalEditDialogUploadContext = () =>
  useContext(EditDialogUploadContext);
