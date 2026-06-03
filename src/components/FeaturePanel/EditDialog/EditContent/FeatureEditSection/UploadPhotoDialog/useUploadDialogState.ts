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
  initialFile?: File | null;
};

const useResetOnClose = (open: boolean, reset: () => void) => {
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);
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
  };
};

const prepareAndPopulate = async (
  rawFile: File,
  feature: Feature,
  form: FormState,
) => {
  form.setErrorMessage(null);
  form.setStage('preparing');
  try {
    const preparedFile = await preparePhotoForUpload(rawFile, feature);
    const url = URL.createObjectURL(preparedFile.file);
    const suggestedCategories = await suggestCommonsCategories(feature);
    form.setPrepared(preparedFile);
    form.setPreviewUrl(url);
    form.setFilenameStem(preparedFile.filenameParts.stem);
    form.setCategories(suggestedCategories);
    form.setDescription(getDefaultDescription(feature));
    form.setStage('review');
  } catch (e) {
    form.setErrorMessage(
      e instanceof Error ? e.message : 'Failed to prepare file for upload',
    );
    form.setStage('choose-file');
  }
};

const resetForm = (form: FormState) => {
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
};

const performUpload = async (
  form: FormState,
  feature: Feature,
  activeUser: { username: string; realname?: string },
  onUploaded: (fileTagValue: string) => void,
) => {
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
      onProgress: form.setProgress,
    });
    form.setStage('success');
    onUploaded(result.fileTagValue);
  } catch (e) {
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
  initialFile,
}: Args) => {
  const { user, handleLogin } = useWikimediaCommonsAuthContext();
  const lastConsumedInitialFile = useRef<File | null>(null);
  const form = useFormState();

  useResetOnClose(open, () => {
    resetForm(form);
    lastConsumedInitialFile.current = null;
  });
  useRevokeOnUnmount(form.previewUrl);

  const handleFileChosen = (rawFile: File) => {
    if (!feature) return;
    return prepareAndPopulate(rawFile, feature, form);
  };

  useEffect(() => {
    if (!open || !initialFile || !feature) return;
    if (lastConsumedInitialFile.current === initialFile) return;
    lastConsumedInitialFile.current = initialFile;
    prepareAndPopulate(initialFile, feature, form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFile, feature]);

  const handleUpload = async () => {
    if (!form.prepared || !feature) return;
    let activeUser = user;
    if (!activeUser) {
      try {
        activeUser = await handleLogin();
      } catch {
        return;
      }
    }
    if (!activeUser) return;
    await performUpload(form, feature, activeUser, onUploaded);
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
    handleFileChosen,
    handleUpload,
  };
};
