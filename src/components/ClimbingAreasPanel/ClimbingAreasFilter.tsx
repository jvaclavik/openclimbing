import { useState } from 'react';
import React from 'react';
import { FormControlLabel, Switch } from '@mui/material';
import { t } from '../../services/intl';
import { CragsInAreaFilterIcon } from '../FeaturePanel/Climbing/Filter/CragsInAreaFilterIcon';
import { GLASS_PAPER_SX, PopperWithArrow } from '../utils/PopperWithArrow';
import {
  FilterBody,
  FilterCard,
} from '../FeaturePanel/Climbing/Filter/filterUi';

type ClimbingAreasFilterProps = {
  filterViewport: boolean;
  onFilterViewportChange: (checked: boolean) => void;
};

export const ClimbingAreasFilter = ({
  filterViewport,
  onFilterViewportChange,
}: ClimbingAreasFilterProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setOpen(!open);
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <CragsInAreaFilterIcon
        open={open}
        onClick={handleToggle}
        touched={filterViewport}
      />
      <PopperWithArrow
        title={t('crag_filter.title')}
        isOpen={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        offset={[0, 8]}
        sx={{ minWidth: 260 }}
        paperSx={GLASS_PAPER_SX}
        onClickAway={(event) => {
          if (anchorEl?.contains(event.target as Node)) return;
          setOpen(false);
        }}
      >
        <FilterBody>
          <FilterCard>
            <FormControlLabel
              sx={{
                mx: 0,
                width: '100%',
                justifyContent: 'space-between',
              }}
              labelPlacement="start"
              control={
                <Switch
                  checked={filterViewport}
                  onChange={(event) =>
                    onFilterViewportChange(event.target.checked)
                  }
                  size="small"
                />
              }
              label={t('climbingareas.filter_viewport')}
              slotProps={{
                typography: { sx: { fontWeight: 600, fontSize: '0.85rem' } },
              }}
            />
          </FilterCard>
        </FilterBody>
      </PopperWithArrow>
    </>
  );
};
