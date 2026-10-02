import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { t } from '../../../../../services/intl';
import { PoiIcon } from '../../../../utils/icons/PoiIcon';
import { useEditContext } from '../../context/EditContext';
import { useSelectedEditItems } from '../../context/useMultiEdit';

export const SelectionList = () => {
  const { current, setCurrent, selectedIds, setSelectedIds } = useEditContext();
  const selected = useSelectedEditItems();

  const selectOnly = (shortId: string) => {
    setSelectedIds([shortId]);
    setCurrent(shortId);
  };

  const deselect = (shortId: string) => {
    const next = selectedIds.filter((id) => id !== shortId);
    if (next.length === 0) return;
    setSelectedIds(next);
    if (shortId === current) setCurrent(next[next.length - 1]);
  };

  return (
    <Stack sx={{ mb: 2, gap: 0.75 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1">
          {t('editdialog.selected_features')}
        </Typography>
        <Chip size="small" label={selected.length} />
      </Stack>
      {selected.map((item) => {
        const name = item.tags.name || item.presetLabel || item.shortId;
        return (
          <Box
            key={item.shortId}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              pl: 0.5,
              borderRadius: 1,
              bgcolor: 'action.selected',
            }}
          >
            <Box
              component="button"
              type="button"
              title={t('editdialog.select_only')}
              onClick={() => selectOnly(item.shortId)}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                border: 0,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                py: 0.75,
                font: 'inherit',
              }}
            >
              <PoiIcon tags={item.tags} size={16} middle themed />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {name}
                </Typography>
                {item.tags.name && item.presetLabel ? (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {item.presetLabel}
                  </Typography>
                ) : null}
              </Box>
            </Box>
            <Tooltip title={t('editdialog.deselect')}>
              <IconButton
                size="small"
                aria-label={t('editdialog.deselect')}
                onClick={() => deselect(item.shortId)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}
      <Typography variant="caption" color="text.secondary">
        {t('editdialog.multi_edit_hint')}
      </Typography>
    </Stack>
  );
};
