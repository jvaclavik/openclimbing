import React from 'react';
import { Button, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { t } from '../../../../services/intl';
import { useMapStateContext } from '../../../utils/MapStateContext';
import { useAddNewCragContext } from './AddNewCragContext';

const MIN_ZOOM = 15;

export const AddNewCragBanner = () => {
  const { isActive, confirm } = useAddNewCragContext();
  const { view } = useMapStateContext();
  const zoom = parseFloat(view[0]);
  const zoomedEnough = zoom >= MIN_ZOOM;

  return (
    <Snackbar
      open={isActive}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Paper
        elevation={6}
        sx={{ px: 2, py: 1.5, maxWidth: 600, width: '100%' }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="body2">
            {zoomedEnough
              ? t('add_new_crag.banner_text')
              : t('add_new_crag.zoom_in')}
          </Typography>
          {zoomedEnough && (
            <Button
              variant="contained"
              color="primary"
              onClick={confirm}
              sx={{ flexShrink: 0 }}
            >
              {t('add_new_crag.continue_button')}
            </Button>
          )}
        </Stack>
      </Paper>
    </Snackbar>
  );
};
