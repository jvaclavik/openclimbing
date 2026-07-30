import React from 'react';
import { Badge, IconButton } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { t } from '../../services/intl';
import { useMobileMode } from '../helpers';
import { usePoiCategoriesContext } from '../utils/PoiCategoriesContext';

export const PoiCategoriesButton = () => {
  const isMobileMode = useMobileMode();
  const { activeKeys, requestOpen } = usePoiCategoriesContext();
  const count = activeKeys.length;

  return (
    <Badge badgeContent={count} color="primary" overlap="circular">
      <IconButton
        onClick={requestOpen}
        size={isMobileMode ? 'small' : 'medium'}
        title={t('poi_categories.button')}
        aria-label={t('poi_categories.button')}
      >
        {count ? (
          <PlaceIcon color="primary" fontSize="small" />
        ) : (
          <PlaceOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Badge>
  );
};
