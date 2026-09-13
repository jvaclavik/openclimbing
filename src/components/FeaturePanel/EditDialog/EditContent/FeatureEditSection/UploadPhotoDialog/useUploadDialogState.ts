import { useEffect, useRef, useState } from 'react';
import { Feature } from '../../../../../../services/types';
import { useWikimediaCommonsAuthContext } from '../../../../../utils/WikimediaCommonsAuthContext';
import { suggestCommonsCategories } from '../../../../../../services/wikimedia/upload/category';
import {
  PreparedUpload,
  preparePhotoForUpload,
  uploadPhotoToCommons,
} from '../../../../../../services/wikimedia/upload/uploadPhoto';
import {
  DEFAULT_LICENSE,
  getDefaultDescription,
  LicenseId,
} from '../../../../../../services/wikimedia/upload/wikitext';
import { UploadProgressEvent } from '../../../../../../services/wikimedia/api';

export type Stage =
  | 'choose-file'
  | 'preparing'
  | 'review'
  | 'uploading'
  | 'success';

type Args = {
  open: boolean;
  feature: Feature | null;
  onUploaded: (fileTagValue: string) => void;
  initialFiles?: File[] | null;
};

type ReviewPhoto = {
  prepared: PreparedUpload;
  filenameStem: string;
  description: string;
  categories: string[];
  license: LicenseId;
};

const useResetOnClose = (open: boolean, reset: () => void) => {
  // `reset` is a fresh closure every render, so it must not be an effect
  // dependency — otherwise the effect re-runs on every commit and, because
  // resetForm sets state (e.g. a new [] for categories), loops forever
  // ("Maximum update depth exceeded"). Keep the latest reset in a ref and only
  // react to `open` actually changing.
  const resetRef = useRef(reset);
  resetRef.current = reset;
  useEffect(() => {
    if (!open) resetRef.current();
  }, [open]);
};

type FormState = {
  stage: Stage;
  setStage: (s: Stage) => void;
  batchItems: ReviewPhoto[];
  setBatchItems: (items: ReviewPhoto[]) => void;
  batchItemsRef: { current: ReviewPhoto[] };
  previewUrl: string | null;
  setPreviewUrl: (
    url: string | null | ((prev: string | null) => string | null),
  ) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  progress: UploadProgressEvent | null;
  setProgress: (v: UploadProgressEvent | null) => void;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  skippedFilesCount: number;
  setSkippedFilesCount: (v: number) => void;
  skippedFilesMessage: string | null;
  setSkippedFilesMessage: (v: string | null) => void;
  successfulUploads: number;
  setSuccessfulUploads: (v: number) => void;
  /**
   * Monotonic id of the active batch. Bumped when a batch starts or the form
   * resets, so async work (prepare/upload) started for an old batch can detect
   * it has been superseded/canceled and drop its results instead of writing
   * them back into a reset or unrelated dialog.
   */
  generationRef: { current: number };
};

const useFormState = (): FormState => {
  const [stage, setStage] = useState<Stage>('choose-file');
  const [batchItemsState, setBatchItemsState] = useState<ReviewPhoto[]>([]);
  const batchItemsRef = useRef<ReviewPhoto[]>([]);
  const setBatchItems = (items: ReviewPhoto[]) => {
    batchItemsRef.current = items;
    setBatchItemsState(items);
  };
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<UploadProgressEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skippedFilesCount, setSkippedFilesCount] = useState(0);
  const [skippedFilesMessage, setSkippedFilesMessage] = useState<string | null>(
    null,
  );
  const [successfulUploads, setSuccessfulUploads] = useState(0);
  const generationRef = useRef(0);
  return {
    stage,
    setStage,
    batchItems: batchItemsState,
    setBatchItems,
    batchItemsRef,
    previewUrl,
    setPreviewUrl: setPreviewUrl as FormState['setPreviewUrl'],
    currentIndex,
    setCurrentIndex,
    progress,
    setProgress,
    errorMessage,
    setErrorMessage,
    skippedFilesCount,
    setSkippedFilesCount,
    skippedFilesMessage,
    setSkippedFilesMessage,
    successfulUploads,
    setSuccessfulUploads,
    generationRef,
  };
};

const resetForm = (form: FormState) => {
  // Invalidate any prepare/upload still awaiting for the batch being torn down.
  form.generationRef.current += 1;
  form.setStage('choose-file');
  form.setBatchItems([]);
  form.setPreviewUrl((url) => {
    if (url) URL.revokeObjectURL(url);
    return null;
  });
  form.setCurrentIndex(0);
  form.setProgress(null);
  form.setErrorMessage(null);
  form.setSkippedFilesCount(0);
  form.setSkippedFilesMessage(null);
  form.setSuccessfulUploads(0);
};

const startBatch = async (files: File[], feature: Feature, form: FormState) => {
  if (files.length === 0) return;

  const generation = form.generationRef.current + 1;
  form.generationRef.current = generation;
  form.setBatchItems([]);
  form.setPreviewUrl((url) => {
    if (url) URL.revokeObjectURL(url);
    return null;
  });
  form.setCurrentIndex(0);
  form.setStage('preparing');
  form.setProgress(null);
  form.setErrorMessage(null);
  form.setSkippedFilesCount(0);
  form.setSkippedFilesMessage(null);
  form.setSuccessfulUploads(0);

  const suggestedCategoriesPromise = suggestCommonsCategories(feature);
  const nextBatchItems: ReviewPhoto[] = [];
  let skippedFilesCount = 0;
  let skippedFilesMessage: string | null = null;

  for (const rawFile of files) {
    try {
      const [prepared, suggestedCategories] = await Promise.all([
        preparePhotoForUpload(rawFile, feature),
        suggestedCategoriesPromise,
      ]);
      if (form.generationRef.current !== generation) return;
      nextBatchItems.push({
        prepared,
        filenameStem: prepared.filenameParts.stem,
        description: getDefaultDescription(feature),
        categories: [...suggestedCategories],
        license: DEFAULT_LICENSE,
      });
    } catch (e) {
      if (form.generationRef.current !== generation) return;
      skippedFilesCount += 1;
      skippedFilesMessage =
        e instanceof Error ? e.message : 'Failed to prepare file for upload';
    }
  }

  if (form.generationRef.current !== generation) return;

  form.setSkippedFilesCount(skippedFilesCount);
  form.setSkippedFilesMessage(skippedFilesMessage);

  if (nextBatchItems.length === 0) {
    form.setErrorMessage(
      skippedFilesMessage ?? 'Failed to prepare file for upload',
    );
    form.setStage('choose-file');
    return;
  }

  form.setBatchItems(nextBatchItems);
  form.setCurrentIndex(0);
  form.setStage('review');
};

const performUpload = async (
  form: FormState,
  feature: Feature,
  activeUser: { username: string; realname?: string },
  onUploaded: (fileTagValue: string) => void,
  generation: number,
) => {
  if (form.generationRef.current !== generation) return;
  const items = form.batchItemsRef.current;
  if (items.length === 0) return;

  form.setStage('uploading');
  form.setCurrentIndex(0);
  form.setProgress(null);
  form.setErrorMessage(null);

  let successfulUploads = 0;

  for (let index = 0; index < items.length; index += 1) {
    if (form.generationRef.current !== generation) return;
    form.setCurrentIndex(index);
    form.setProgress(null);

    const item = form.batchItemsRef.current[index];
    if (!item) return;

    try {
      const result = await uploadPhotoToCommons({
        prepared: item.prepared,
        filenameStem: item.filenameStem,
        feature,
        user: activeUser,
        description: item.description,
        categories: item.categories,
        license: item.license,
        onProgress: (progress) => {
          if (form.generationRef.current === generation) {
            form.setProgress(progress);
          }
        },
      });
      // The photo really did upload, so always record it into a slot.
      onUploaded(result.fileTagValue);
      successfulUploads += 1;
      // If a new batch took over meanwhile, let it drive the UI from here.
      if (form.generationRef.current !== generation) return;
      form.setSuccessfulUploads(successfulUploads);
    } catch (e) {
      if (form.generationRef.current !== generation) return;
      form.setSuccessfulUploads(successfulUploads);
      form.setErrorMessage(
        e instanceof Error ? e.message : 'Upload to Wikimedia Commons failed',
      );
      form.setStage('review');
      return;
    }
  }

  if (form.generationRef.current !== generation) return;
  form.setStage('success');
};

export const useUploadDialogState = ({
  open,
  feature,
  onUploaded,
  initialFiles,
}: Args) => {
  const { user, handleLogin } = useWikimediaCommonsAuthContext();
  const lastConsumedInitialFiles = useRef<File[] | null>(null);
  const form = useFormState();
  const currentPhoto = form.batchItems[form.currentIndex] ?? null;
  const currentPhotoFile = currentPhoto?.prepared.file ?? null;
  const { setPreviewUrl } = form;

  useResetOnClose(open, () => {
    resetForm(form);
    lastConsumedInitialFiles.current = null;
  });
  useEffect(
    () => () => {
      form.generationRef.current += 1;
    },
    [form.generationRef],
  );
  useEffect(() => {
    if (!currentPhotoFile) {
      setPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      return;
    }
    const nextUrl = URL.createObjectURL(currentPhotoFile);
    setPreviewUrl((url) => {
      if (url) URL.revokeObjectURL(url);
      return nextUrl;
    });
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [currentPhotoFile, setPreviewUrl]);

  const handleFilesChosen = (files: File[]) => {
    if (!feature) return undefined;
    return startBatch(files, feature, form);
  };

  useEffect(() => {
    if (!open || !initialFiles || initialFiles.length === 0 || !feature) return;
    if (lastConsumedInitialFiles.current === initialFiles) return;
    lastConsumedInitialFiles.current = initialFiles;
    void startBatch(initialFiles, feature, form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFiles, feature]);

  const updateCurrentPhoto = (
    updater: (current: ReviewPhoto) => ReviewPhoto,
  ) => {
    const current = form.batchItemsRef.current[form.currentIndex];
    if (!current) return;
    form.setBatchItems(
      form.batchItemsRef.current.map((item, index) =>
        index === form.currentIndex ? updater(current) : item,
      ),
    );
  };

  const handleUpload = async () => {
    if (!currentPhoto || !feature) return;
    const generation = form.generationRef.current;
    let activeUser = user;
    if (!activeUser) {
      try {
        activeUser = await handleLogin();
      } catch {
        return;
      }
    }
    if (!activeUser || form.generationRef.current !== generation) return;
    await performUpload(form, feature, activeUser, onUploaded, generation);
  };

  return {
    stage: form.stage,
    prepared: currentPhoto?.prepared ?? null,
    previewUrl: form.previewUrl,
    filenameStem: currentPhoto?.filenameStem ?? '',
    setFilenameStem: (filenameStem: string) =>
      updateCurrentPhoto((item) => ({ ...item, filenameStem })),
    description: currentPhoto?.description ?? '',
    setDescription: (description: string) =>
      updateCurrentPhoto((item) => ({ ...item, description })),
    categories: currentPhoto?.categories ?? [],
    setCategories: (categories: string[]) =>
      updateCurrentPhoto((item) => ({ ...item, categories })),
    license: currentPhoto?.license ?? DEFAULT_LICENSE,
    setLicense: (license: LicenseId) =>
      updateCurrentPhoto((item) => ({ ...item, license })),
    progress: form.progress,
    errorMessage: form.errorMessage,
    skippedFilesCount: form.skippedFilesCount,
    skippedFilesMessage: form.skippedFilesMessage,
    batchTotal: form.batchItems.length,
    successfulUploads: form.successfulUploads,
    batchPosition: currentPhoto ? form.currentIndex + 1 : 0,
    canGoPrevious: form.currentIndex > 0,
    canGoNext: form.currentIndex < form.batchItems.length - 1,
    handlePreviousPhoto: () => {
      if (form.currentIndex > 0) {
        form.setCurrentIndex(form.currentIndex - 1);
      }
    },
    handleNextPhoto: () => {
      if (form.currentIndex < form.batchItems.length - 1) {
        form.setCurrentIndex(form.currentIndex + 1);
      }
    },
    handleFilesChosen,
    handleUpload,
  };
};
