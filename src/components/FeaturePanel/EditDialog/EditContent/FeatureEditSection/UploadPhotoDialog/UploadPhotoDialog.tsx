import React from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { t } from '../../../../../../services/intl';
import { useFeatureContext } from '../../../../../utils/FeatureContext';
import { useWikimediaCommonsAuthContext } from '../../../../../utils/WikimediaCommonsAuthContext';
import { UploadDialogAuthBar } from './UploadDialogAuthBar';
import { UploadDialogForm } from './UploadDialogForm';
import { useUploadDialogState } from './useUploadDialogState';

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded: (fileTagValue: string) => void;
  initialFile?: File | null;
};

const ChooseFileStage: React.FC<{
  onFileChosen: (file: File) => void;
}> = ({ onFileChosen }) => (
  <Stack spacing={1} alignItems="stretch">
    <Typography variant="body2" color="text.secondary">
      {t('uploaddialog.choose_file_hint')}
    </Typography>
    <Button component="label" variant="contained" size="large" fullWidth>
      {t('uploaddialog.choose_file')}
      <input
        type="file"
        hidden
        accept="image/*,.heic,.heif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFileChosen(f);
        }}
      />
    </Button>
  </Stack>
);

const PreparingStage: React.FC = () => (
  <Stack spacing={1} alignItems="center" p={2}>
    <CircularProgress />
    <Typography variant="body2">{t('uploaddialog.preparing')}</Typography>
  </Stack>
);

const UploadActionsProgress: React.FC<{
  progress: { loaded: number; total: number } | null;
}> = ({ progress }) => {
  const percent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
      : undefined;
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ mr: 'auto', pl: 1 }}
    >
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">
        {percent !== undefined
          ? t('uploaddialog.uploading_percent', { percent })
          : t('uploaddialog.uploading')}
      </Typography>
    </Stack>
  );
};

const UploadDialogActions: React.FC<{
  stage: string;
  uploading: boolean;
  uploadDisabled: boolean;
  onClose: () => void;
  onUpload: () => void;
}> = ({ stage, uploading, uploadDisabled, onClose, onUpload }) => {
  if (stage === 'success') {
    return (
      <Button onClick={onClose} variant="contained">
        {t('uploaddialog.done')}
      </Button>
    );
  }
  return (
    <>
      <Button onClick={onClose} disabled={uploading}>
        {t('uploaddialog.cancel')}
      </Button>
      <Button onClick={onUpload} variant="contained" disabled={uploadDisabled}>
        {t('uploaddialog.upload')}
      </Button>
    </>
  );
};

export const UploadPhotoDialog: React.FC<Props> = ({
  open,
  onClose,
  onUploaded,
  initialFile,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { feature } = useFeatureContext();
  const { loading: authLoading } = useWikimediaCommonsAuthContext();

  const state = useUploadDialogState({
    open,
    feature,
    onUploaded,
    initialFile,
  });
  const {
    stage,
    prepared,
    previewUrl,
    filenameStem,
    setFilenameStem,
    description,
    setDescription,
    categories,
    setCategories,
    license,
    setLicense,
    progress,
    errorMessage,
    handleFileChosen,
    handleUpload,
  } = state;

  const uploading = stage === 'uploading';

  return (
    <Dialog
      open={open}
      onClose={uploading ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ pr: 6 }}>
        {t('uploaddialog.title')}
        <IconButton
          onClick={onClose}
          disabled={uploading}
          aria-label={t('uploaddialog.close')}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <UploadDialogAuthBar />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {stage === 'choose-file' && (
            <ChooseFileStage onFileChosen={handleFileChosen} />
          )}
          {stage === 'preparing' && <PreparingStage />}
          {(stage === 'review' || stage === 'uploading') && previewUrl && (
            <UploadDialogForm
              previewUrl={previewUrl}
              prepared={prepared}
              filenameStem={filenameStem}
              setFilenameStem={setFilenameStem}
              description={description}
              setDescription={setDescription}
              categories={categories}
              setCategories={setCategories}
              license={license}
              setLicense={setLicense}
              uploading={uploading}
              progress={progress}
            />
          )}
          {stage === 'success' && (
            <Alert severity="success">{t('uploaddialog.success')}</Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {uploading && <UploadActionsProgress progress={progress} />}
        <UploadDialogActions
          stage={stage}
          uploading={uploading}
          uploadDisabled={
            stage !== 'review' || !filenameStem || !prepared || authLoading
          }
          onClose={onClose}
          onUpload={handleUpload}
        />
      </DialogActions>
    </Dialog>
  );
};
