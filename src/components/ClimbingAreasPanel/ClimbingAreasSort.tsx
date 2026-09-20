import { useState } from 'react';
import React from 'react';
import { Badge, IconButton, Stack, Tooltip } from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { GLASS_PAPER_SX, PopperWithArrow } from '../utils/PopperWithArrow';
import {
  FilterBody,
  FilterCard,
  FilterOption,
} from '../FeaturePanel/Climbing/Filter/filterUi';

export type ClimbingAreasSortBy =
  | 'photos'
  | 'routes'
  | 'sectors'
  | 'alphabetical'
  | 'added';

export const ROCK_SORT_OPTIONS: {
  value: ClimbingAreasSortBy;
  labelId: TranslationId;
}[] = [
  { value: 'photos', labelId: 'climbingareas.sort_photos' },
  { value: 'routes', labelId: 'climbingareas.sort_routes' },
  { value: 'sectors', labelId: 'climbingareas.sort_sectors' },
  { value: 'alphabetical', labelId: 'climbingareas.sort_alphabetical' },
  { value: 'added', labelId: 'climbingareas.sort_added' },
];

export const POI_SORT_OPTIONS = ROCK_SORT_OPTIONS.filter(
  (option) => option.value === 'alphabetical' || option.value === 'added',
);

type ClimbingAreasSortProps = {
  sortBy: ClimbingAreasSortBy;
  onSortByChange: (value: ClimbingAreasSortBy) => void;
  options: typeof ROCK_SORT_OPTIONS;
  isDefault: boolean;
};

export const ClimbingAreasSort = ({
  sortBy,
  onSortByChange,
  options,
  isDefault,
}: ClimbingAreasSortProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setOpen(!open);
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setOpen(false);

  return (
    <>
      <Tooltip title={t('crag_sort.title')}>
        <IconButton
          color={open ? 'primary' : 'secondary'}
          edge="end"
          onClick={handleClick}
        >
          <Badge variant="dot" color="primary" invisible={isDefault}>
            <SwapVertIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <PopperWithArrow
        title={t('climbingareas.sort_label')}
        isOpen={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        offset={[0, 8]}
        sx={{ minWidth: 240 }}
        paperSx={GLASS_PAPER_SX}
        onClickAway={(event) => {
          if (anchorEl?.contains(event.target as Node)) return;
          handleClose();
        }}
      >
        <FilterBody>
          <FilterCard>
            <Stack
              sx={{
                gap: 0.5,
              }}
            >
              {options.map(({ value, labelId }) => (
                <FilterOption
                  key={value}
                  type="button"
                  $selected={sortBy === value}
                  onClick={() => {
                    onSortByChange(value);
                    handleClose();
                  }}
                >
                  {t(labelId)}
                </FilterOption>
              ))}
            </Stack>
          </FilterCard>
        </FilterBody>
      </PopperWithArrow>
    </>
  );
};
