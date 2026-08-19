import { useState } from 'react';
import React from 'react';
import {
  Button,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { allPresets } from '../../../../../../services/tagging/data';
import { t } from '../../../../../../services/intl';
import { useCurrentItem } from '../../../context/EditContext';
import { PoiIcon } from '../../../../../utils/icons/PoiIcon';
import { PresetMenu } from './PresetMenu';
import { useFeatureContext } from '../../../../../utils/FeatureContext';
import { useOsmAuthContext } from '../../../../../utils/OsmAuthContext';
import { useBoolState } from '../../../../../helpers';

const useEnabledState = () => {
  const { feature } = useFeatureContext();
  const { loggedIn } = useOsmAuthContext();
  const [enabled, enable] = useBoolState(feature.point || !loggedIn);
  return { enabled, enable };
};

export const PresetSelect = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { presetKey, presetLabel } = useCurrentItem();
  const poiTags = allPresets[presetKey]?.tags;
  const { enabled, enable } = useEnabledState();
  const isPlaceholder = presetKey === 'point';

  const openMenu = (element: HTMLElement) => {
    if (!enabled) return;
    setAnchorEl(element);
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip
        arrow
        title={enabled ? '' : t('editdialog.preset_select.change_type_warning')}
      >
        <TextField
          fullWidth
          margin="dense"
          variant="outlined"
          label={t('editdialog.preset_select.label')}
          value={isPlaceholder ? '' : presetLabel}
          placeholder={t('editdialog.preset_select.placeholder')}
          onClick={(event) => openMenu(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openMenu(event.currentTarget);
            }
          }}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { readOnly: true },
            input: {
              startAdornment:
                !isPlaceholder && poiTags ? (
                  <InputAdornment position="start">
                    <PoiIcon tags={poiTags} size={16} middle themed />
                  </InputAdornment>
                ) : undefined,
              endAdornment: (
                <InputAdornment position="end">
                  <ArrowDropDownIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiInputBase-root': {
              cursor: enabled ? 'pointer' : 'default',
            },
            '& .MuiInputBase-input': {
              cursor: enabled ? 'pointer' : 'default',
            },
          }}
        />
      </Tooltip>

      {!enabled && (
        <Button color="secondary" onClick={enable}>
          {t('editdialog.preset_select.edit_button')}
        </Button>
      )}

      <PresetMenu anchorEl={anchorEl} onClose={() => setAnchorEl(null)} />
    </Stack>
  );
};
