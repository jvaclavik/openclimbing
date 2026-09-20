import React, { useState } from 'react';
import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material';
import { t } from '../../../../../services/intl';
import { Setter } from '../../../../../types';
import { getPresetTranslation } from '../../../../../services/tagging/translations';
import { useUserSettingsContext } from '../../../../utils/userSettings/UserSettingsContext';
import { toHumanDistance } from '../../../../Directions/helpers';
import { nearbyShortId, useNearbyClimbing } from './useNearbyClimbing';

const TYPE_LABELS: Record<'area' | 'crag', string> = {
  area: 'type/site/climbing/area',
  crag: 'climbing/crag',
};

type NearbyOption = {
  shortId: string;
  label: string;
  secondary: string;
};

type Props = {
  nearbyType: 'area' | 'crag';
  label: string;
  setLabel: Setter<string>;
  onSelectExisting: (shortId: string) => Promise<void>;
  onCreateNew: (e: { preventDefault: () => void }) => void;
};

export const NearbyClimbingAutocomplete = ({
  nearbyType,
  label,
  setLabel,
  onSelectExisting,
  onCreateNew,
}: Props) => {
  const [open, setOpen] = useState(false);
  const { records, loading } = useNearbyClimbing(open ? nearbyType : null);
  const { isImperial } = useUserSettingsContext().userSettings;
  const heading =
    nearbyType === 'area'
      ? t('editdialog.nearby.areas')
      : t('editdialog.nearby.crags');

  const options: NearbyOption[] = records.map((record) => {
    const shortId = nearbyShortId(record);
    const typeKey = TYPE_LABELS[record.type];
    return {
      shortId,
      label: record.name || shortId,
      secondary: [
        typeKey ? getPresetTranslation(typeKey) : null,
        record.parentName
          ? t('editdialog.nearby.in_parent', { name: record.parentName })
          : null,
        toHumanDistance(isImperial, record.distanceMeters),
      ]
        .filter(Boolean)
        .join(' · '),
    };
  });

  return (
    <Autocomplete
      freeSolo
      openOnFocus
      autoHighlight
      sx={{ minWidth: 260, flex: 1 }}
      slotProps={{
        listbox: {
          sx: { maxHeight: 320 },
        },
      }}
      options={options}
      groupBy={() => heading}
      renderGroup={(params) => (
        <li key={params.key}>
          <Box
            sx={{
              px: 2,
              pt: 1,
              pb: 0.5,
              color: 'text.secondary',
              typography: 'caption',
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            {params.group}
          </Box>
          <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
        </li>
      )}
      loading={loading}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      inputValue={label}
      value={null}
      onInputChange={(_e, value, reason) => {
        if (reason !== 'reset') setLabel(value);
      }}
      onChange={(_e, value) => {
        if (value && typeof value !== 'string') {
          void onSelectExisting(value.shortId);
        }
      }}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.label
      }
      isOptionEqualToValue={(option, value) =>
        typeof option !== 'string' &&
        typeof value !== 'string' &&
        option.shortId === value.shortId
      }
      filterOptions={(opts, state) => {
        const query = state.inputValue.trim().toLowerCase();
        if (!query) return opts;
        return opts.filter((option) =>
          option.label.toLowerCase().includes(query),
        );
      }}
      noOptionsText={
        nearbyType === 'area'
          ? t('editdialog.nearby.no_areas')
          : t('editdialog.nearby.no_crags')
      }
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.shortId}>
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {option.label}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.disabled', fontSize: 11 }}
            >
              {option.secondary}
            </Typography>
          </Stack>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          autoFocus
          label={t('editdialog.members.name')}
          placeholder={t('editdialog.members.name')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !open) {
              onCreateNew(e);
            }
          }}
        />
      )}
    />
  );
};
