import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { Box, IconButton, Paper, Stack, Tooltip } from '@mui/material';
import React from 'react';
import { t } from '../../../../../services/intl';
import { TextFieldWithCharacterCount } from './helpers';
import { WikimediaCommonsThumb } from './WikimediaCommonsThumb';

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

export const WikimediaCommonsGalleryRow: React.FC<Props> = ({
  fileKey,
  index,
  value,
  focusTag,
  onValueChange,
  onRemove,
  dragHandle,
}) => {
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
          <WikimediaCommonsThumb value={value} />
        </Stack>

        <Box
          flex={1}
          minWidth={0}
          sx={{
            alignSelf: { xs: 'stretch', sm: 'auto' },
          }}
        >
          <TextFieldWithCharacterCount
            label={label}
            errorText={
              invalidFile
                ? t('editdialog.upload_photo_filename_error')
                : undefined
            }
            error={invalidFile}
            k={fileKey}
            autoFocus={focusTag === fileKey}
            placeholder="File:Photo example.jpg (or paste URL)"
            onChange={(e) => onValueChange(fileKey, e.target.value)}
            value={value}
            margin="none"
            multiline={false}
          />
        </Box>

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
