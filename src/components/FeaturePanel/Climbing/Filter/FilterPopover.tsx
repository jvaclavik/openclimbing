import { Button, IconButton, Stack, Tooltip } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import React from 'react';
import { t } from '../../../../services/intl';
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
import { FilterBody } from './filterUi';

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
        <Stack
          direction="row"
          sx={{
            gap: 0.5,
            alignItems: 'center',
            mr: 1,
          }}
        >
          <Tooltip title={t('crag_filter.reset')}>
            <span>
              <IconButton
                size="small"
                onClick={reset}
                disabled={isDefaultFilter}
                aria-label={t('crag_filter.reset')}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            onClick={handleClose}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            {t('crag_filter.done')}
          </Button>
        </Stack>
      }
    >
      <FilterBody>
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
            showPhotoDrawn={showRockFilters}
            showLength={showRockFilters}
          />
        )}
      </FilterBody>
    </PopperWithArrow>
  );
};
