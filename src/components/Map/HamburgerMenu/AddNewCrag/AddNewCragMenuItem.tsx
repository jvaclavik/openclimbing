import React from 'react';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import { t } from '../../../../services/intl';
import { useAddNewCragContext } from './AddNewCragContext';

type Props = {
  closeMenu: () => void;
};

export const AddNewCragMenuItem = ({ closeMenu }: Props) => {
  const { start } = useAddNewCragContext();

  const handleClick = () => {
    start();
    closeMenu();
  };

  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        <AddLocationAltIcon />
      </ListItemIcon>
      <ListItemText>{t('add_new_crag.menu_link')}</ListItemText>
    </MenuItem>
  );
};
