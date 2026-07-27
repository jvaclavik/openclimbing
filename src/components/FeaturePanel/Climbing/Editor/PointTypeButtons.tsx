import { useClimbingContext } from '../contexts/ClimbingContext';
import React, { useState } from 'react';
import { PointType } from '../types';
import { Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { t } from '../../../../services/intl';
import { addShortcutUnderline } from './utils';

type ButtonDef = {
  type: PointType | 'none';
  message: string;
  shortcut: string;
};

const pointTypes: Array<ButtonDef> = [
  {
    type: 'bolt',
    message: t('climbingpanel.climbing_point_bolt'),
    shortcut: 'b',
  },
  {
    type: 'anchor',
    message: t('climbingpanel.climbing_point_anchor'),
    shortcut: 'a',
  },
  {
    type: 'sling',
    message: t('climbingpanel.climbing_point_sling'),
    shortcut: 's',
  },
  {
    type: 'piton',
    message: t('climbingpanel.climbing_point_piton'),
    shortcut: 'p',
  },
  {
    type: 'unfinished',
    message: t('climbingpanel.climbing_point_unfinished'),
    shortcut: 'u',
  },
  {
    type: 'none',
    message: t('climbingpanel.climbing_point_none'),
    shortcut: 'n',
  },
];

export const PointTypeButtons = () => {
  const { machine, getCurrentPath, pointSelectedIndex } = useClimbingContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const selectedPoint = getCurrentPath()?.[pointSelectedIndex];
  const currentType = selectedPoint?.type ?? null;

  const onPointTypeChange = (type: PointType | 'none') => {
    machine.execute('changePointType', { type: type === 'none' ? null : type });
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
      >
        {t('climbingpanel.type')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {pointTypes.map(({ message, type, shortcut }) => {
          const isSelected =
            type === 'none' ? !currentType : currentType === type;
          return (
            <MenuItem
              key={type}
              dense
              selected={isSelected}
              title={t('shortcut', { shortcut })}
              onClick={() => onPointTypeChange(type)}
            >
              {addShortcutUnderline(message, shortcut)}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};
