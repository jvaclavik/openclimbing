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
import { markEditDialogForResume } from '../../../../../../services/wikimedia/auth/oauthFlow';
import { useFeatureContext } from '../../../../../utils/FeatureContext';
import { useWikimediaCommonsAuthContext } from '../../../../../utils/WikimediaCommonsAuthContext';
import { UploadDialogAuthBar } from './UploadDialogAuthBar';
import { UploadDialogForm } from './UploadDialogForm';
import { useUploadDialogState } from './useUploadDialogState';

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded: (fileTagValue: string) => void;
  initialFiles?: File[] | null;
};

const ChooseFileStage: React.FC<{
  onFilesChosen: (files: File[]) => void;
}> = ({ onFilesChosen }) => (
  <Stack
    spacing={1}
    sx={{
      alignItems: 'stretch',
    }}
  >
    <Typography
      variant="body2"
      sx={{
        color: 'text.secondary',
      }}
    >
      {t('uploaddialog.choose_file_hint')}
    </Typography>
    <Button
      component="label"
      variant="contained"
      size="large"
      fullWidth
      onClick={() => markEditDialogForResume()}
    >
      {t('uploaddialog.choose_file')}
      <input
        type="file"
        hidden
        multiple
        accept="image/*,.heic,.heif"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) onFilesChosen(files);
        }}
      />
    </Button>
  </Stack>
);

const PreparingStage: React.FC = () => (
  <Stack
    spacing={1}
    sx={{
      alignItems: 'center',
      p: 2,
    }}
  >
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
      sx={{
        alignItems: 'center',
        mr: 'auto',
        pl: 1,
      }}
    >
      <CircularProgress size={20} />
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
        }}
      >
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
  uploadLabel: string;
  onClose: () => void;
  onUpload: () => void;
}> = ({ stage, uploading, uploadDisabled, uploadLabel, onClose, onUpload }) => {
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
        {uploadLabel}
      </Button>
    </>
  );
};

const BatchReviewNavigation: React.FC<{
  batchPosition: number;
  batchTotal: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  handlePreviousPhoto: () => void;
  handleNextPhoto: () => void;
}> = ({
  batchPosition,
  batchTotal,
  canGoPrevious,
  canGoNext,
  handlePreviousPhoto,
  handleNextPhoto,
}) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Typography
      variant="body2"
      sx={{
        color: 'text.secondary',
        fontWeight: 'medium',
      }}
    >
      {t('uploaddialog.photo_progress', {
        current: batchPosition,
        total: batchTotal,
      })}
    </Typography>
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        onClick={handlePreviousPhoto}
        disabled={!canGoPrevious}
        aria-label={
          canGoPrevious
            ? `${t('uploaddialog.previous_photo')} (${t(
                'uploaddialog.photo_progress',
                {
                  current: batchPosition - 1,
                  total: batchTotal,
                },
              )})`
            : t('uploaddialog.previous_photo')
        }
      >
        {t('uploaddialog.previous_photo')}
      </Button>
      <Button
        size="small"
        onClick={handleNextPhoto}
        disabled={!canGoNext}
        aria-label={
          canGoNext
            ? `${t('uploaddialog.next_photo')} (${t(
                'uploaddialog.photo_progress',
                {
                  current: batchPosition + 1,
                  total: batchTotal,
                },
              )})`
            : t('uploaddialog.next_photo')
        }
      >
        {t('uploaddialog.next_photo')}
      </Button>
    </Stack>
  </Stack>
);

export const UploadPhotoDialog: React.FC<Props> = ({
  open,
  onClose,
  onUploaded,
  initialFiles,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { feature } = useFeatureContext();
  const { loading: authLoading } = useWikimediaCommonsAuthContext();

  const state = useUploadDialogState({
    open,
    feature,
    onUploaded,
    initialFiles,
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
    skippedFilesCount,
    skippedFilesMessage,
    batchTotal,
    isBatchValid,
    successfulUploads,
    batchPosition,
    canGoPrevious,
    canGoNext,
    handlePreviousPhoto,
    handleNextPhoto,
    handleFilesChosen,
    handleUpload,
  } = state;

  const uploading = stage === 'uploading';
  const showBatchProgress =
    batchTotal > 1 && (stage === 'review' || stage === 'uploading');

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
          {showBatchProgress && (
            stage === 'review' ? (
              <BatchReviewNavigation
                batchPosition={batchPosition}
                batchTotal={batchTotal}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                handlePreviousPhoto={handlePreviousPhoto}
                handleNextPhoto={handleNextPhoto}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 'medium',
                }}
              >
                {t('uploaddialog.photo_progress', {
                  current: batchPosition,
                  total: batchTotal,
                })}
              </Typography>
            )
          )}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {(stage !== 'choose-file' || successfulUploads > 0) &&
            skippedFilesCount > 0 &&
            skippedFilesMessage && (
            <Alert severity="warning">
              {stage === 'success'
                ? t(
                    skippedFilesCount === 1
                      ? 'uploaddialog.skipped_single_success'
                      : 'uploaddialog.skipped_multiple_success',
                    {
                      count: skippedFilesCount,
                    },
                  )
                : t(
                    skippedFilesCount === 1
                      ? 'uploaddialog.skipped_single'
                      : 'uploaddialog.skipped_multiple',
                    {
                      count: skippedFilesCount,
                      reason: skippedFilesMessage,
                    },
                  )}
            </Alert>
          )}
          {stage === 'choose-file' && (
            <ChooseFileStage onFilesChosen={handleFilesChosen} />
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
            <Alert severity="success">
              {successfulUploads !== 1
                ? t('uploaddialog.success_multiple', {
                    count: successfulUploads,
                  })
                : t('uploaddialog.success')}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {uploading && <UploadActionsProgress progress={progress} />}
        <UploadDialogActions
          stage={stage}
          uploading={uploading}
          uploadDisabled={
            stage !== 'review' || !isBatchValid || !prepared || authLoading
          }
          uploadLabel={t(
            batchTotal > 1 ? 'uploaddialog.upload_all' : 'uploaddialog.upload',
          )}
          onClose={onClose}
          onUpload={handleUpload}
        />
      </DialogActions>
    </Dialog>
  );
};
