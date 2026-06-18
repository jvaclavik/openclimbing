import {
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useEditDialogFeature } from './utils';
import { t } from '../../../services/intl';
import EditIcon from '@mui/icons-material/Edit';
import BugReportOutlined from '@mui/icons-material/BugReportOutlined';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
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
  const { debugMode, maximized, toggleMaximized } =
    useEditDialogUploadContext();
  const theme = useTheme();
  // The dialog is already fullscreen on mobile, so hiding the toggle there.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          {!isMobile && (
            <Tooltip
              title={t(
                maximized ? 'editdialog.restore_size' : 'editdialog.maximize',
              )}
            >
              <IconButton
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximized();
                }}
                aria-label={t(
                  maximized ? 'editdialog.restore_size' : 'editdialog.maximize',
                )}
              >
                {maximized ? (
                  <FullscreenExitIcon fontSize="small" />
                ) : (
                  <FullscreenIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}

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
