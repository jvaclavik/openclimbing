import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { TICKS_SORT_KEYS, TicksSortKey } from './ticksSort';

const LABELS: Record<TicksSortKey, TranslationId> = {
  date_desc: 'my_ticks.sort.date_desc',
  date_asc: 'my_ticks.sort.date_asc',
  grade_desc: 'my_ticks.sort.grade_desc',
  points_desc: 'my_ticks.sort.points_desc',
  name_asc: 'my_ticks.sort.name_asc',
};

const label = (key: TicksSortKey) => t(LABELS[key]);

export const TicksSortMenu = ({
  value,
  onChange,
}: {
  value: TicksSortKey;
  onChange: (key: TicksSortKey) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button
        size="small"
        color="secondary"
        startIcon={<SortIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="menu"
        aria-label={t('my_ticks.sort.label')}
        sx={{ minWidth: 0 }}
      >
        {label(value)}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {TICKS_SORT_KEYS.map((key) => (
          <MenuItem
            key={key}
            selected={key === value}
            onClick={() => {
              onChange(key);
              setAnchorEl(null);
            }}
          >
            {label(key)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
