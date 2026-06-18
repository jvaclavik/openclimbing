import React, { createContext, useCallback, useContext, useState } from 'react';
import { useDebugMode } from '../../utils/debug';

type UploadRequest = {
  initialFile: File | null;
  /** Specific slot key to fill (e.g. wikimedia_commons:2). When omitted, the next free slot is used. */
  targetSlotKey: string | null;
};

type EditDialogUploadContextType = {
  debugMode: boolean;
  uploadRequest: UploadRequest | null;
  openUpload: (req?: Partial<UploadRequest>) => void;
  closeUpload: () => void;
  maximized: boolean;
  toggleMaximized: () => void;
};

const EditDialogUploadContext = createContext<
  EditDialogUploadContextType | undefined
>(undefined);

export const EditDialogUploadProvider: React.FC = ({ children }) => {
  const { debugMode } = useDebugMode();
  const [uploadRequest, setUploadRequest] = useState<UploadRequest | null>(
    null,
  );
  const [maximized, setMaximized] = useState<boolean>(false);

  const toggleMaximized = useCallback(() => setMaximized((m) => !m), []);

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
