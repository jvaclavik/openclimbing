import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { t } from '../../../../../../services/intl';
import { useCurrentItem } from '../../../context/EditContext';
import { useOptionalEditDialogUploadContext } from '../../../EditDialogUploadContext';
import {
  canHaveStartPhoto,
  START_PHOTO_KEY,
} from '../../../../Climbing/utils/photo';
import { WikimediaCommonsGalleryRow } from '../WikimediaCommonsGalleryRow';
import { normalizeWikimediaCommonsInput } from '../WikimediaCommonsGallery';

const RouteStartPhotoField = () => {
  const { tags, setTag, setTagsEntries } = useCurrentItem();
  const uploadCtx = useOptionalEditDialogUploadContext();
  const value = tags[START_PHOTO_KEY] ?? '';

  // "Add route start photo" opened the dialog – go straight to the upload
  useEffect(() => {
    if (uploadCtx?.consumeStartPhotoRequest() && !value.trim()) {
      uploadCtx.openUpload({ targetSlotKey: START_PHOTO_KEY });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ mb: 2 }}>
      <WikimediaCommonsGalleryRow
        fileKey={START_PHOTO_KEY}
        index={0}
        label={t('start_photo.label')}
        value={value}
        focusTag={false} // the filename input would pop up the keyboard after upload
        onValueChange={(key, raw) =>
          setTag(key, normalizeWikimediaCommonsInput(raw))
        }
        onRemove={() =>
          setTagsEntries((prev) => prev.filter(([k]) => k !== START_PHOTO_KEY))
        }
      />
      <Typography
        variant="caption"
        component="p"
        sx={{ color: 'text.secondary', mt: 0.5, mx: 1.5 }}
      >
        {t('start_photo.hint')}
      </Typography>
    </Box>
  );
};

export const StartPhotoEditor = () => {
  const { tags } = useCurrentItem();
  return canHaveStartPhoto(tags) ? <RouteStartPhotoField /> : null;
};
