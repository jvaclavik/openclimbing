import React from 'react';
import { Button } from '@mui/material';
import AddAPhotoOutlinedIcon from '@mui/icons-material/AddAPhotoOutlined';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useEditDialogContext } from '../helpers/EditDialogContext';
import { PanelSidePadding } from '../../utils/PanelHelpers';
import { t } from '../../../services/intl';
import {
  canHaveStartPhoto,
  hasStartPhoto,
  START_PHOTO_KEY,
} from './utils/photo';

// Opens the edit dialog straight to the start photo upload (see StartPhotoEditor)
export const AddStartPhotoButton = () => {
  const { feature } = useFeatureContext();
  const { openWithTag } = useEditDialogContext();
  const { tags, deleted, skeleton } = feature;

  if (deleted || skeleton || !canHaveStartPhoto(tags) || hasStartPhoto(tags)) {
    return null;
  }

  return (
    <PanelSidePadding>
      <Button
        size="small"
        startIcon={<AddAPhotoOutlinedIcon />}
        onClick={() => openWithTag(START_PHOTO_KEY)}
        sx={{ mt: 1 }}
      >
        {t('start_photo.add_button')}
      </Button>
    </PanelSidePadding>
  );
};
