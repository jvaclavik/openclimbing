import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
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
    <ListItemButton onClick={handleClick}>
      <ListItemIcon>
        <AddLocationAltIcon />
      </ListItemIcon>
      <ListItemText>{t('add_new_crag.menu_link')}</ListItemText>
    </ListItemButton>
  );
};
