import { DialogTitle, IconButton, Stack, Tooltip } from '@mui/material';
import React from 'react';
import { useEditDialogFeature } from './utils';
import { t } from '../../../services/intl';
import EditIcon from '@mui/icons-material/Edit';
import BugReportOutlined from '@mui/icons-material/BugReportOutlined';
import { useEditContext } from './context/EditContext';
import CloseIcon from '@mui/icons-material/Close';
import { useEditDialogContext } from '../helpers/EditDialogContext';
import { useEditDialogUploadContext } from './EditDialogUploadContext';

const useGetDialogTitle = (isAddPlace, isUndelete) => {
  const { items } = useEditContext();
  if (isAddPlace) return t('editdialog.add_heading');
  if (isUndelete) return t('editdialog.undelete_heading');

  if (items.length > 1)
    return `${t('editdialog.edit_heading')}: ${items.length} ${t('editdialog.items')}`;
  return `${t('editdialog.edit_heading')}`;
};

export const EditDialogTitle = () => {
  const { isAddPlace, isUndelete } = useEditDialogFeature();
  const { close } = useEditDialogContext();
  const { debugMode } = useEditDialogUploadContext();

  const dialogTitle = useGetDialogTitle(isAddPlace, isUndelete);

  return (
    <DialogTitle
      id="edit-dialog-title"
      sx={{ cursor: 'default', userSelect: 'none' }}
    >
      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" gap={2} alignItems="center">
          <EditIcon />
          {dialogTitle}
          {debugMode && (
            <Tooltip title={t('uploaddialog.debug_mode_on')}>
              <BugReportOutlined
                fontSize="small"
                color="warning"
                aria-label={t('uploaddialog.debug_mode_on')}
              />
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" gap={0.5} alignItems="center">
          <IconButton
            color="secondary"
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </DialogTitle>
  );
};
