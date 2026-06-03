import React from 'react';
import {
  Alert,
  Box,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { t } from '../../../../../../services/intl';
import { PreparedUpload } from '../../../../../../services/wikimedia/upload/uploadPhoto';
import {
  LICENSE_OPTIONS,
  LicenseId,
} from '../../../../../../services/wikimedia/upload/wikitext';
import { UploadProgressEvent } from '../../../../../../services/wikimedia/api';
import { CategoriesAutocomplete } from './CategoriesAutocomplete';

type Props = {
  previewUrl: string;
  prepared: PreparedUpload | null;
  filenameStem: string;
  setFilenameStem: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  categories: string[];
  setCategories: (next: string[]) => void;
  license: LicenseId;
  setLicense: (v: LicenseId) => void;
  uploading: boolean;
  progress: UploadProgressEvent | null;
};

const computePercent = (progress: UploadProgressEvent | null) => {
  if (!progress || progress.total === 0) return undefined;
  return Math.min(100, Math.round((progress.loaded / progress.total) * 100));
};

const UploadProgressBar: React.FC<{
  progress: UploadProgressEvent | null;
}> = ({ progress }) => {
  const percent = computePercent(progress);
  return (
    <Stack spacing={1}>
      <LinearProgress
        variant={percent === undefined ? 'indeterminate' : 'determinate'}
        value={percent}
      />
      <Typography variant="caption">
        {percent !== undefined
          ? t('uploaddialog.uploading_percent', { percent })
          : t('uploaddialog.uploading')}
      </Typography>
    </Stack>
  );
};

export const UploadDialogForm: React.FC<Props> = ({
  previewUrl,
  prepared,
  filenameStem,
  setFilenameStem,
  description,
  setDescription,
  categories,
  setCategories,
  license,
  setLicense,
  uploading,
  progress,
}) => {
  const ext = prepared?.filenameParts.ext ?? 'jpg';
  return (
    <>
      <Box
        component="img"
        src={previewUrl}
        alt=""
        sx={{
          width: '100%',
          maxHeight: 240,
          objectFit: 'contain',
          bgcolor: 'action.hover',
          borderRadius: 1,
        }}
      />

      <TextField
        label={t('uploaddialog.filename_label')}
        helperText={t('uploaddialog.filename_help')}
        value={filenameStem}
        onChange={(e) => setFilenameStem(e.target.value)}
        fullWidth
        disabled={uploading}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">.{ext}</InputAdornment>
            ),
          },
        }}
      />

      <TextField
        label={t('uploaddialog.description_label')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        multiline
        minRows={2}
        disabled={uploading}
      />

      <CategoriesAutocomplete
        value={categories}
        onChange={setCategories}
        disabled={uploading}
        helperText={t('uploaddialog.category_help')}
      />

      <TextField
        select
        label={t('uploaddialog.license_label')}
        helperText={t('uploaddialog.license_help')}
        value={license}
        onChange={(e) => setLicense(e.target.value as LicenseId)}
        fullWidth
        disabled={uploading}
      >
        {LICENSE_OPTIONS.map((opt) => (
          <MenuItem key={opt.id} value={opt.id}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      <Alert severity="info" variant="outlined">
        {t('uploaddialog.license_notice')}
      </Alert>

      {prepared?.exifLocation && (
        <Typography variant="caption" color="text.secondary">
          {t('uploaddialog.exif_location', {
            lat: prepared.exifLocation[1].toFixed(5),
            lon: prepared.exifLocation[0].toFixed(5),
          })}
        </Typography>
      )}
      {prepared?.exifDate && (
        <Typography variant="caption" color="text.secondary">
          {t('uploaddialog.exif_date', {
            date: prepared.exifDate.toLocaleString(),
          })}
        </Typography>
      )}

      {uploading && <UploadProgressBar progress={progress} />}
    </>
  );
};
