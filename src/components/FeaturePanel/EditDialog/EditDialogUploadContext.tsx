import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { useDebugMode } from '../../utils/debug';
import { useEditDialogContext } from '../helpers/EditDialogContext';
import { START_PHOTO_KEY } from '../Climbing/utils/photo';

type UploadRequest = {
  initialFiles: File[];
  /** Specific slot key to fill (e.g. wikimedia_commons:2). When omitted, the next free slot is used. */
  targetSlotKey: string | null;
};

type EditDialogUploadContextType = {
  debugMode: boolean;
  uploadRequest: UploadRequest | null;
  openUpload: (req?: Partial<UploadRequest>) => void;
  closeUpload: () => void;
  /** True once per edit session opened via "Add start photo" – the upload should follow right away. */
  consumeStartPhotoRequest: () => boolean;
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
  const editDialog = useEditDialogContext();
  // the provider lives only while the edit dialog is open, so this is per session
  const startPhotoRequestRef = useRef(editDialog?.focusTag === START_PHOTO_KEY);
  const consumeStartPhotoRequest = useCallback(() => {
    const requested = startPhotoRequestRef.current;
    startPhotoRequestRef.current = false;
    return requested;
  }, []);

  const toggleMaximized = useCallback(() => setMaximized((m) => !m), []);

  const openUpload = useCallback((req?: Partial<UploadRequest>) => {
    setUploadRequest({
      initialFiles: req?.initialFiles ?? [],
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
        consumeStartPhotoRequest,
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
