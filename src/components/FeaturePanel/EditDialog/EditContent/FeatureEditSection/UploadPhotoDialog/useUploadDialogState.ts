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

const useRevokeOnUnmount = (url: string | null) => {
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
};

type FormState = {
  stage: Stage;
  setStage: (s: Stage) => void;
  prepared: PreparedUpload | null;
  setPrepared: (p: PreparedUpload | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (
    u: string | null | ((prev: string | null) => string | null),
  ) => void;
  filenameStem: string;
  setFilenameStem: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  categories: string[];
  setCategories: (v: string[]) => void;
  license: LicenseId;
  setLicense: (v: LicenseId) => void;
  progress: UploadProgressEvent | null;
  setProgress: (v: UploadProgressEvent | null) => void;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  skippedFilesCount: number;
  setSkippedFilesCount: (v: number | ((prev: number) => number)) => void;
  skippedFilesMessage: string | null;
  setSkippedFilesMessage: (v: string | null) => void;
  /** Files still waiting to be prepared/uploaded (excludes the current one). */
  queue: File[];
  setQueue: (v: File[]) => void;
  /** Total number of files in the current batch (1 for a single upload). */
  batchTotal: number;
  setBatchTotal: (v: number) => void;
  /** Number of files successfully uploaded in the active batch. */
  successfulUploads: number;
  setSuccessfulUploads: (v: number | ((prev: number) => number)) => void;
  successfulUploadsRef: { current: number };
  suggestedCategoriesPromiseRef: { current: Promise<string[]> | null };
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
  const [prepared, setPrepared] = useState<PreparedUpload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filenameStem, setFilenameStem] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [license, setLicense] = useState<LicenseId>(DEFAULT_LICENSE);
  const [progress, setProgress] = useState<UploadProgressEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skippedFilesCount, setSkippedFilesCount] = useState(0);
  const [skippedFilesMessage, setSkippedFilesMessage] = useState<string | null>(
    null,
  );
  const [queue, setQueue] = useState<File[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [successfulUploads, setSuccessfulUploads] = useState(0);
  const successfulUploadsRef = useRef(0);
  const suggestedCategoriesPromiseRef = useRef<Promise<string[]> | null>(null);
  const generationRef = useRef(0);
  return {
    stage,
    setStage,
    prepared,
    setPrepared,
    previewUrl,
    setPreviewUrl: setPreviewUrl as FormState['setPreviewUrl'],
    filenameStem,
    setFilenameStem,
    description,
    setDescription,
    categories,
    setCategories,
    license,
    setLicense,
    progress,
    setProgress,
    errorMessage,
    setErrorMessage,
    skippedFilesCount,
    setSkippedFilesCount,
    skippedFilesMessage,
    setSkippedFilesMessage,
    queue,
    setQueue,
    batchTotal,
    setBatchTotal,
    successfulUploads,
    setSuccessfulUploads,
    successfulUploadsRef,
    suggestedCategoriesPromiseRef,
    generationRef,
  };
};

const prepareAndPopulate = async (
  rawFile: File,
  remainingQueue: File[],
  feature: Feature,
  form: FormState,
  generation: number,
  suggestedCategoriesPromise: Promise<string[]>,
) => {
  form.setErrorMessage(null);
  form.setStage('preparing');
  try {
    const [preparedFile, suggestedCategories] = await Promise.all([
      preparePhotoForUpload(rawFile, feature),
      suggestedCategoriesPromise,
    ]);
    // The dialog was closed or a new batch started while we were awaiting —
    // drop this result so it can't resurrect a canceled file (and don't create
    // an object URL we'd then have to revoke).
    if (form.generationRef.current !== generation) return;
    const url = URL.createObjectURL(preparedFile.file);
    form.setPrepared(preparedFile);
    // Revoke the previous preview (e.g. the prior file in a multi-file batch)
    // so its object URL doesn't leak when we swap in the new one.
    form.setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    form.setFilenameStem(preparedFile.filenameParts.stem);
    form.setCategories([...suggestedCategories]);
    form.setDescription(getDefaultDescription(feature));
    form.setStage('review');
  } catch (e) {
    if (form.generationRef.current !== generation) return;
    const message =
      e instanceof Error ? e.message : 'Failed to prepare file for upload';
    form.setSkippedFilesCount((prev) => prev + 1);
    form.setSkippedFilesMessage(message);
    // Don't strand the rest of a multi-file batch on one bad file — move on to
    // the next queued one, or fall back to the file picker if it was the last.
    // `remainingQueue` is threaded explicitly (not read from form state) because
    // this runs inside an async chain where form.queue would be stale.
    const [next, ...rest] = remainingQueue;
    if (next) {
      form.setQueue(rest);
      await prepareAndPopulate(
        next,
        rest,
        feature,
        form,
        generation,
        suggestedCategoriesPromise,
      );
    } else {
      if (form.successfulUploadsRef.current > 0) {
        form.setStage('success');
      } else {
        form.setErrorMessage(message);
        form.setStage('choose-file');
      }
    }
  }
};

/**
 * Starts a batch of one or more files: remembers the batch size, queues the
 * rest, and begins preparing the first one. Non-image files should be filtered
 * out by the caller.
 */
const startBatch = (files: File[], feature: Feature, form: FormState) => {
  if (files.length === 0) return undefined;
  const [first, ...rest] = files;
  // New batch — invalidate any async work still in flight from a previous one.
  const generation = form.generationRef.current + 1;
  form.generationRef.current = generation;
  form.setErrorMessage(null);
  form.setSkippedFilesCount(0);
  form.setSkippedFilesMessage(null);
  form.setBatchTotal(files.length);
  form.successfulUploadsRef.current = 0;
  form.setSuccessfulUploads(0);
  form.setQueue(rest);
  const suggestedCategoriesPromise = suggestCommonsCategories(feature);
  form.suggestedCategoriesPromiseRef.current = suggestedCategoriesPromise;
  return prepareAndPopulate(
    first,
    rest,
    feature,
    form,
    generation,
    suggestedCategoriesPromise,
  );
};

const resetForm = (form: FormState) => {
  // Invalidate any prepare/upload still awaiting for the batch being torn down.
  form.generationRef.current += 1;
  form.setStage('choose-file');
  form.setPrepared(null);
  form.setPreviewUrl((url) => {
    if (url) URL.revokeObjectURL(url);
    return null;
  });
  form.setFilenameStem('');
  form.setDescription('');
  form.setCategories([]);
  form.setLicense(DEFAULT_LICENSE);
  form.setProgress(null);
  form.setErrorMessage(null);
  form.setSkippedFilesCount(0);
  form.setSkippedFilesMessage(null);
  form.setQueue([]);
  form.setBatchTotal(0);
  form.successfulUploadsRef.current = 0;
  form.setSuccessfulUploads(0);
  form.suggestedCategoriesPromiseRef.current = null;
};

const performUpload = async (
  form: FormState,
  feature: Feature,
  activeUser: { username: string; realname?: string },
  onUploaded: (fileTagValue: string) => void,
  generation: number,
) => {
  if (form.generationRef.current !== generation) return;
  const suggestedCategoriesPromise = form.suggestedCategoriesPromiseRef.current;
  if (!suggestedCategoriesPromise) {
    form.setErrorMessage('Failed to prepare file for upload');
    form.setStage('choose-file');
    return;
  }
  form.setStage('uploading');
  form.setProgress(null);
  form.setErrorMessage(null);
  try {
    const result = await uploadPhotoToCommons({
      prepared: form.prepared!,
      filenameStem: form.filenameStem,
      feature,
      user: activeUser,
      description: form.description,
      categories: form.categories,
      license: form.license,
      onProgress: (progress) => {
        if (form.generationRef.current === generation) {
          form.setProgress(progress);
        }
      },
    });
    // The photo really did upload, so always record it into a slot.
    onUploaded(result.fileTagValue);
    // If a new batch took over meanwhile, let it drive the UI from here.
    if (form.generationRef.current !== generation) return;
    const nextSuccessfulUploads = form.successfulUploadsRef.current + 1;
    form.successfulUploadsRef.current = nextSuccessfulUploads;
    form.setSuccessfulUploads(nextSuccessfulUploads);
    // Move on to the next file in the batch (each gets its own review step),
    // or finish when the queue is empty. `form.queue` is fresh here because each
    // upload is a separate user action (its own render).
    const [next, ...rest] = form.queue;
    if (next) {
      form.setQueue(rest);
      await prepareAndPopulate(
        next,
        rest,
        feature,
        form,
        generation,
        suggestedCategoriesPromise,
      );
    } else {
      form.setStage('success');
    }
  } catch (e) {
    if (form.generationRef.current !== generation) return;
    form.setErrorMessage(
      e instanceof Error ? e.message : 'Upload to Wikimedia Commons failed',
    );
    form.setStage('review');
  }
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

  useResetOnClose(open, () => {
    resetForm(form);
    lastConsumedInitialFiles.current = null;
  });
  useRevokeOnUnmount(form.previewUrl);
  useEffect(
    () => () => {
      form.generationRef.current += 1;
    },
    [form.generationRef],
  );

  const handleFilesChosen = (files: File[]) => {
    if (!feature) return undefined;
    return startBatch(files, feature, form);
  };

  useEffect(() => {
    if (!open || !initialFiles || initialFiles.length === 0 || !feature) return;
    if (lastConsumedInitialFiles.current === initialFiles) return;
    lastConsumedInitialFiles.current = initialFiles;
    startBatch(initialFiles, feature, form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFiles, feature]);

  const handleUpload = async () => {
    if (!form.prepared || !feature) return;
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
    prepared: form.prepared,
    previewUrl: form.previewUrl,
    filenameStem: form.filenameStem,
    setFilenameStem: form.setFilenameStem,
    description: form.description,
    setDescription: form.setDescription,
    categories: form.categories,
    setCategories: form.setCategories,
    license: form.license,
    setLicense: form.setLicense,
    progress: form.progress,
    errorMessage: form.errorMessage,
    skippedFilesCount: form.skippedFilesCount,
    skippedFilesMessage: form.skippedFilesMessage,
    batchTotal: form.batchTotal,
    successfulUploads: form.successfulUploads,
    // 1-based index of the file currently being prepared/reviewed/uploaded.
    batchPosition: form.batchTotal - form.queue.length,
    handleFilesChosen,
    handleUpload,
  };
};
