import FilterListAltIcon from '@mui/icons-material/FilterListAlt';
import { Badge, IconButton, Tooltip } from '@mui/material';
import React from 'react';
import { t } from '../../../../services/intl';

export const CragsInAreaFilterIcon = ({
  onClick,
  open,
  touched,
}: {
  open: boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  touched: boolean;
}) => {
  return (
    <Tooltip title={t('crag_filter.title')}>
      <IconButton
        color={open ? 'primary' : 'default'}
        edge="end"
        onClick={onClick}
      >
        <Badge variant="dot" color="primary" invisible={!touched}>
          <FilterListAltIcon fontSize="small" />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
