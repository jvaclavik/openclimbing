import React from 'react';
import { Button, Chip, Tooltip } from '@mui/material';
import AddAPhotoOutlinedIcon from '@mui/icons-material/AddAPhotoOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useEditDialogContext } from '../helpers/EditDialogContext';
import { PanelSidePadding } from '../../utils/PanelHelpers';
import { Feature } from '../../../services/types';
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

// Opens the crag in the edit dialog, which leads from route to route
export const StartPhotoCoverageChip = ({ routes }: { routes: Feature[] }) => {
  const { openWithTag } = useEditDialogContext();
  const startPhotoRoutes = routes.filter(({ tags }) => canHaveStartPhoto(tags));

  if (!startPhotoRoutes.length) {
    return null;
  }

  const withPhoto = startPhotoRoutes.filter(({ tags }) =>
    hasStartPhoto(tags),
  ).length;
  const label = t('start_photo.coverage_tooltip', {
    withPhoto: `${withPhoto}`,
    total: `${startPhotoRoutes.length}`,
  });

  return (
    <Tooltip title={label} enterDelay={700} enterNextDelay={700}>
      <Chip
        size="small"
        variant="outlined"
        icon={<PhotoCameraOutlinedIcon />}
        label={`${withPhoto}/${startPhotoRoutes.length}`}
        aria-label={label}
        onClick={() => openWithTag(START_PHOTO_KEY)}
      />
    </Tooltip>
  );
};
