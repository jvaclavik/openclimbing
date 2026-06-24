import { Button, Stack, Box, Typography } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import React from 'react';
import { t, Translation } from '../../../../services/intl';
import { MinimumRoutesFilter } from './MinimumRoutesFilter';
import { GradeFilter } from './GradeFilter';
import { ClimbingTypeFilter } from './ClimbingTypeFilter';
import { AdvancedFilters } from './AdvancedFilters';
import {
  GLASS_PAPER_SX,
  PopperWithArrow,
} from '../../../utils/PopperWithArrow';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { Placement } from '@popperjs/core';
import { Setter } from '../../../../types';
import { useMapStateContext } from '../../../utils/MapStateContext';

const ResetButton = (props: { onClick: () => void }) => (
  <Button
    onClick={props.onClick}
    size="small"
    color="secondary"
    variant="outlined"
    startIcon={<RestartAltIcon fontSize="small" />}
  >
    {t('crag_filter.reset')}
  </Button>
);

const DoneButton = (props: { onClick: () => void }) => (
  <Button
    variant="contained"
    size="small"
    onClick={props.onClick}
    sx={{ mr: 1 }}
  >
    {t('crag_filter.done')}
  </Button>
);

const ZoomWarning = () => {
  // First zoom level without omitted pois due to "optimization to grid"
  // - see climbingTileSource#updateData() loads tile level 9 for mapzoom >= 10
  // - see getClimbingTile() to which zoom levels "isOptimizedToGrid"
  const ZOOM_LEVEL = 10;

  const [zoom, lat, lon] = useMapStateContext().view;
  if (parseFloat(zoom) >= ZOOM_LEVEL) {
    return null;
  }
  return (
    // TODO the FilterPopover should be probably fixed to maxWidth. But maybe there is a reason.
    <Box mx={2} pb={1} sx={{ maxWidth: '300px' }}>
      <Typography variant="body2">
        <Translation
          id="crag_filter.zoom_in"
          values={{ zoom: `${ZOOM_LEVEL}+ (~3 km)` }}
          tags={{
            link: 'a href="https://community.openclimbing.org/d/12-map-filtering-is-in-beta" target="_blank"',
          }}
        />
      </Typography>
    </Box>
  );
};

type FilterPopoverProps = {
  anchorEl: null | HTMLElement;
  open: boolean;
  setOpen: Setter<boolean>;
  placement?: Placement;
  offset?: [number, number];
};

export const FilterPopover = ({
  anchorEl,
  open,
  setOpen,
  placement,
  offset,
}: FilterPopoverProps) => {
  const { reset, isDefaultFilter, poiTypes } =
    useUserSettingsContext().climbingFilter;

  // Show difficulty/route filters only for rock POIs (e.g. not for via ferratas)
  const showRockFilters = poiTypes.rock;
  const showFamilyFriendly = poiTypes.rock || poiTypes.ferrata;
  const showAdvancedFilters = showRockFilters || showFamilyFriendly;

  const handleClose = () => setOpen(false);

  return (
    <PopperWithArrow
      title={t('crag_filter.title')}
      isOpen={open}
      anchorEl={anchorEl}
      placement={placement}
      offset={offset}
      sx={{ minWidth: 320, maxWidth: 360 }}
      paperSx={GLASS_PAPER_SX}
      addition={
        <Stack direction="row" gap={1} alignItems="center">
          {!isDefaultFilter && <ResetButton onClick={reset} />}
          <DoneButton onClick={handleClose} />
        </Stack>
      }
    >
      <Box>
        <ClimbingTypeFilter />
        {showRockFilters && (
          <>
            <GradeFilter />
            <MinimumRoutesFilter />
          </>
        )}
        {showAdvancedFilters && (
          <AdvancedFilters
            showClimbingType={showRockFilters}
            showInclination={showRockFilters}
            showMaterial={showRockFilters}
            showFamilyFriendly={showFamilyFriendly}
          />
        )}
        <ZoomWarning />
      </Box>
    </PopperWithArrow>
  );
};
