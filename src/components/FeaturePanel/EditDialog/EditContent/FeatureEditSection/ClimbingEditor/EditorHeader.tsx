import React, { useState } from 'react';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { t } from '../../../../../../services/intl';
import { getLabel } from './EditorItem';
import { useMultiEdit } from '../../../context/useMultiEdit';

export const EditorHeader: React.FC<{
  label: string;
  inactive: string[];
}> = ({ label, inactive }) => {
  const { setTag } = useMultiEdit();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const onClick = (e) => setAnchorEl(e.currentTarget);

  const handleAdd = (k: string) => {
    setTag(k, 'yes');
    setAnchorEl(null);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="body1">{label}</Typography>
        <Button variant="text" size="small" onClick={onClick}>
          {t('editdialog.add_value')}
        </Button>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {inactive.map((k) => (
          <MenuItem key={k} onClick={() => handleAdd(k)}>
            {getLabel(k)}
          </MenuItem>
        ))}
        {inactive.length === 0 && (
          <MenuItem disabled>{t('editdialog.all_values_added')}</MenuItem>
        )}
      </Menu>
    </>
  );
};
