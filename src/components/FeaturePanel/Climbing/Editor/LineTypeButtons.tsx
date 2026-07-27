import { useClimbingContext } from '../contexts/ClimbingContext';
import React, { useState } from 'react';
import { LineType } from '../types';
import { Button, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { t } from '../../../../services/intl';

type ButtonDef = {
  previousLineType: LineType;
  message: string;
};

const lineTypes: Array<ButtonDef> = [
  {
    previousLineType: 'solid',
    message: t('climbingpanel.climbing_line_solid'),
  },
  {
    previousLineType: 'dotted',
    message: t('climbingpanel.climbing_line_dotted'),
  },
];

export const LineTypeButtons = () => {
  const { machine, getCurrentPath, pointSelectedIndex } = useClimbingContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const selectedPoint = getCurrentPath()?.[pointSelectedIndex];
  const currentLineType = selectedPoint?.previousLineType ?? 'solid';

  const onLineTypeChange = (previousLineType: LineType) => {
    machine.execute('changeLineType', {
      previousLineType: previousLineType === 'solid' ? null : previousLineType,
    });
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<ArrowDropDownIcon />}
      >
        {t('climbingpanel.line')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {lineTypes.map(({ message, previousLineType }) => (
          <MenuItem
            key={previousLineType}
            dense
            selected={currentLineType === previousLineType}
            onClick={() => onLineTypeChange(previousLineType)}
          >
            {message}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
