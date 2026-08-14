import { useState } from 'react';
import { Stack } from '@mui/material';
import React from 'react';
import { t } from '../../../../services/intl';
import { TranslationId } from '../../../../services/types';
import {
  GLASS_PAPER_SX,
  PopperWithArrow,
} from '../../../utils/PopperWithArrow';
import { CragsInAreaSortButton } from './CragsInAreaSortButton';
import { SortBy } from './types';
import { Setter } from '../../../../types';
import { FilterBody, FilterCard, FilterOption } from '../Filter/filterUi';

type CragsInAreaSortProps = {
  sortBy: SortBy;
  setSortBy: Setter<SortBy>;
};

const OPTIONS: { value: SortBy; label: TranslationId }[] = [
  { value: 'default', label: 'crag_sort.option_default' },
  { value: 'routes', label: 'crag_sort.option_routes' },
  { value: 'photos', label: 'crag_sort.option_photos' },
  { value: 'alphabetical', label: 'crag_sort.option_alphabetical' },
];

export const CragsInAreaSort = ({
  sortBy,
  setSortBy,
}: CragsInAreaSortProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setOpen(!open);
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setOpen(false);

  return (
    <>
      <CragsInAreaSortButton
        open={open}
        onClick={handleClick}
        sortBy={sortBy}
      />
      <PopperWithArrow
        title={t('crag_sort.title')}
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
            <Stack gap={0.5}>
              {OPTIONS.map(({ value, label }) => (
                <FilterOption
                  key={value}
                  type="button"
                  $selected={sortBy === value}
                  onClick={() => {
                    setSortBy(value);
                    handleClose();
                  }}
                >
                  {t(label)}
                </FilterOption>
              ))}
            </Stack>
          </FilterCard>
        </FilterBody>
      </PopperWithArrow>
    </>
  );
};
