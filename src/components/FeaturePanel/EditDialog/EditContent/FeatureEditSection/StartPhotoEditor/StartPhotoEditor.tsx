import React, { useEffect } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import { t } from '../../../../../../services/intl';
import { useCurrentItem, useEditContext } from '../../../context/EditContext';
import { useEnsureEditItems } from '../../../context/useEnsureEditItems';
import { useOptionalEditDialogUploadContext } from '../../../EditDialogUploadContext';
import {
  canHaveStartPhoto,
  START_PHOTO_KEY,
} from '../../../../Climbing/utils/photo';
import { WikimediaCommonsGalleryRow } from '../WikimediaCommonsGalleryRow';
import { normalizeWikimediaCommonsInput } from '../WikimediaCommonsGallery';
import {
  countStartPhotos,
  CragRoute,
  findParentCrag,
  getCragRoutes,
  getNextRouteWithoutStartPhoto,
} from './startPhotoRoutes';

// Opens the route in the dialog and its start photo upload right away, so
// one can walk along the crag photographing route after route.
const useOpenStartPhotoUpload = () => {
  const ensureItems = useEnsureEditItems();
  const { setCurrent, setSelectedIds } = useEditContext();
  const uploadCtx = useOptionalEditDialogUploadContext();

  return async (shortId: string) => {
    try {
      await ensureItems([shortId]);
    } catch {
      return;
    }
    setSelectedIds([shortId]);
    setCurrent(shortId);
    uploadCtx?.openUpload({ targetSlotKey: START_PHOTO_KEY });
  };
};

// "Add start photo" opens the edit dialog – the first item to show up handles
// the request, then it is gone for the rest of the session.
const useStartPhotoRequest = (onRequest: () => void) => {
  const uploadCtx = useOptionalEditDialogUploadContext();
  useEffect(() => {
    if (uploadCtx?.consumeStartPhotoRequest()) {
      onRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const NextRouteButton = ({ route }: { route: CragRoute }) => {
  const openStartPhotoUpload = useOpenStartPhotoUpload();
  return (
    <Button
      size="small"
      endIcon={<ArrowForward />}
      onClick={() => openStartPhotoUpload(route.shortId)}
    >
      {t('start_photo.next_route', {
        name: route.tags.name || t('start_photo.unnamed_route'),
      })}
    </Button>
  );
};

const RouteStartPhotoField = () => {
  const { shortId, tags, setTag, setTagsEntries } = useCurrentItem();
  const { items } = useEditContext();
  const uploadCtx = useOptionalEditDialogUploadContext();
  const value = tags[START_PHOTO_KEY] ?? '';

  useStartPhotoRequest(() => {
    if (!value.trim()) {
      uploadCtx?.openUpload({ targetSlotKey: START_PHOTO_KEY });
    }
  });

  // only when walking along the crag, ie. the crag is opened in this dialog
  const crag = findParentCrag(items, shortId);
  const routes = crag ? getCragRoutes(crag.members, items) : [];
  const nextRoute = getNextRouteWithoutStartPhoto(routes, shortId);

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
      {routes.length > 0 && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mt: 1,
            mx: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('start_photo.crag_progress', {
              withPhoto: `${countStartPhotos(routes)}`,
              total: `${routes.length}`,
            })}
          </Typography>
          {nextRoute && <NextRouteButton route={nextRoute} />}
        </Stack>
      )}
    </Box>
  );
};

const CragStartPhotosBanner = () => {
  const { members } = useCurrentItem();
  const { items } = useEditContext();
  const openStartPhotoUpload = useOpenStartPhotoUpload();
  const routes = getCragRoutes(members, items);
  const nextRoute = getNextRouteWithoutStartPhoto(routes);
  const withPhoto = countStartPhotos(routes);

  useStartPhotoRequest(() => {
    if (nextRoute) {
      openStartPhotoUpload(nextRoute.shortId);
    }
  });

  if (!routes.length) {
    return null;
  }

  return (
    <Alert
      severity={nextRoute ? 'info' : 'success'}
      icon={<PhotoCameraOutlined fontSize="inherit" />}
      sx={{ mb: 2 }}
      action={
        nextRoute && (
          <Button
            color="inherit"
            size="small"
            onClick={() => openStartPhotoUpload(nextRoute.shortId)}
          >
            {withPhoto ? t('start_photo.continue') : t('start_photo.start')}
          </Button>
        )
      }
    >
      {t('start_photo.crag_progress', {
        withPhoto: `${withPhoto}`,
        total: `${routes.length}`,
      })}
    </Alert>
  );
};

export const StartPhotoEditor = () => {
  const { tags } = useCurrentItem();

  if (canHaveStartPhoto(tags)) {
    return <RouteStartPhotoField />;
  }
  if (tags.climbing === 'crag') {
    return <CragStartPhotosBanner />;
  }
  return null;
};
