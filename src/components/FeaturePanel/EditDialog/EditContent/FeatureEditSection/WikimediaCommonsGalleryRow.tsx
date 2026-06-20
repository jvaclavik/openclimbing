import DeleteOutline from '@mui/icons-material/DeleteOutline';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import ArrowBack from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { t } from '../../../../../services/intl';
import { TextFieldWithCharacterCount } from './helpers';
import { WikimediaCommonsThumb } from './WikimediaCommonsThumb';
import { useOptionalEditDialogUploadContext } from '../../EditDialogUploadContext';

const isWikimediaCommonsFileNameInvalid = (value: string) => {
  const regex = /^File:.+\.[a-zA-Z0-9_]+$/;
  return Boolean(value) && !regex.test(value);
};

type Props = {
  fileKey: string;
  index: number;
  value: string;
  focusTag: boolean | string;
  onValueChange: (fileKey: string, raw: string) => void;
  onRemove: () => void;
  dragHandle?: React.ReactNode;
};

type EmptyRowCtaProps = {
  pasteMode: boolean;
  onUpload: () => void;
  onEnterPaste: () => void;
  onLeavePaste: () => void;
};

const EmptyRowCta: React.FC<EmptyRowCtaProps> = ({
  pasteMode,
  onUpload,
  onEnterPaste,
  onLeavePaste,
}) => {
  if (pasteMode) {
    return (
      <Button
        variant="text"
        size="small"
        startIcon={<ArrowBack />}
        onClick={onLeavePaste}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('uploaddialog.row_back_to_upload')}
      </Button>
    );
  }
  return (
    <Stack spacing={1} alignItems="flex-start">
      <Button
        variant="contained"
        size="medium"
        startIcon={<CloudUploadOutlined />}
        onClick={onUpload}
      >
        {t('uploaddialog.row_upload_cta')}
      </Button>
      <Button variant="text" size="small" onClick={onEnterPaste}>
        {t('uploaddialog.row_paste_existing')}
      </Button>
    </Stack>
  );
};

export const WikimediaCommonsGalleryRow: React.FC<Props> = ({
  fileKey,
  index,
  value,
  focusTag,
  onValueChange,
  onRemove,
  dragHandle,
}) => {
  const uploadCtx = useOptionalEditDialogUploadContext();
  const canUpload = Boolean(uploadCtx);
  const handleUploadClick = () =>
    uploadCtx?.openUpload({ targetSlotKey: fileKey });

  const isEmpty = !value.trim();
  // When the upload flow is available, the empty row starts as an upload CTA;
  // the user can switch to paste mode to type/paste an existing filename. If the
  // upload context isn't mounted, the input is shown immediately.
  const [pasteMode, setPasteMode] = useState(!canUpload);
  const showCta = canUpload && isEmpty && !pasteMode;
  const showInput = !showCta;

  const label = `${t('tags.wikimedia_commons_photo')}${
    index > 0 ? ` (${index + 1})` : ''
  }`;
  const invalidFile = isWikimediaCommonsFileNameInvalid(value);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexShrink: 0 }}
        >
          {dragHandle != null && <Box>{dragHandle}</Box>}
          <WikimediaCommonsThumb
            value={value}
            onPlaceholderClick={
              canUpload && isEmpty ? handleUploadClick : undefined
            }
          />
        </Stack>

        <Stack flex={1} minWidth={0} spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>

          {showCta && canUpload && isEmpty && (
            <EmptyRowCta
              pasteMode={pasteMode}
              onUpload={handleUploadClick}
              onEnterPaste={() => setPasteMode(true)}
              onLeavePaste={() => setPasteMode(false)}
            />
          )}

          {showInput && (
            <Stack spacing={0.5}>
              <TextFieldWithCharacterCount
                label=""
                errorText={
                  invalidFile
                    ? t('editdialog.upload_photo_filename_error')
                    : undefined
                }
                error={invalidFile}
                k={fileKey}
                autoFocus={focusTag === fileKey || pasteMode}
                placeholder="File:Photo example.jpg (or paste URL)"
                onChange={(e) => onValueChange(fileKey, e.target.value)}
                value={value}
                margin="none"
                multiline={false}
              />
              {canUpload && isEmpty && pasteMode && (
                <EmptyRowCta
                  pasteMode={pasteMode}
                  onUpload={handleUploadClick}
                  onEnterPaste={() => setPasteMode(true)}
                  onLeavePaste={() => setPasteMode(false)}
                />
              )}
            </Stack>
          )}
        </Stack>

        <Box sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          <Tooltip title={t('editdialog.remove')}>
            <IconButton
              size="small"
              aria-label={t('editdialog.remove')}
              onClick={onRemove}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Paper>
  );
};
