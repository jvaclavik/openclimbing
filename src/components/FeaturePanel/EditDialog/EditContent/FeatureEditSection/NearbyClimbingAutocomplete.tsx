import React, { useState } from 'react';
import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material';
import { t } from '../../../../../services/intl';
import { Setter } from '../../../../../types';
import { getPresetTranslation } from '../../../../../services/tagging/translations';
import { useUserSettingsContext } from '../../../../utils/userSettings/UserSettingsContext';
import { toHumanDistance } from '../../../../Directions/helpers';
import { nearbyShortId, useNearbyClimbing } from './useNearbyClimbing';
import { getRecentParents, RecentParent } from './recentParents';
import { ClimbingNearbyRecord } from '../../../../../types';

const TYPE_LABELS: Record<'area' | 'crag', string> = {
  area: 'type/site/climbing/area',
  crag: 'climbing/crag',
};

type NearbyOption = {
  shortId: string;
  label: string;
  secondary: string;
  group: string;
};

const toSearchText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const matchesQuery = (label: string, query: string) => {
  const text = toSearchText(label);
  return toSearchText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
};

type Props = {
  nearbyType: 'area' | 'crag';
  label: string;
  setLabel: Setter<string>;
  onSelectExisting: (shortId: string) => Promise<void>;
  onCreateNew: (e: { preventDefault: () => void }) => void;
  /** offer the recently linked parents above the nearby ones */
  showRecent?: boolean;
};

export const NearbyClimbingAutocomplete = ({
  nearbyType,
  label,
  setLabel,
  onSelectExisting,
  onCreateNew,
  showRecent,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<RecentParent[]>([]);
  const { records, loading, excludedIds } = useNearbyClimbing(
    open ? nearbyType : null,
    label,
  );
  const { isImperial } = useUserSettingsContext().userSettings;
  const heading =
    nearbyType === 'area'
      ? t('editdialog.nearby.areas')
      : t('editdialog.nearby.crags');
  const recentHeading = t('editdialog.nearby.recent');

  const toOption = (record: ClimbingNearbyRecord, group: string) => {
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
      group,
    };
  };

  // A recent parent that is also nearby is listed once, with its distance.
  const nearbyById = new Map(
    records.map((record) => [nearbyShortId(record), record]),
  );
  const recentOptions: NearbyOption[] = recents
    .filter((recent) => !excludedIds.has(recent.shortId))
    .map((recent) => {
      const nearby = nearbyById.get(recent.shortId);
      return nearby
        ? toOption(nearby, recentHeading)
        : {
            shortId: recent.shortId,
            label: recent.name,
            secondary: getPresetTranslation(TYPE_LABELS[recent.type]),
            group: recentHeading,
          };
    });
  const recentIds = new Set(recentOptions.map(({ shortId }) => shortId));
  const options: NearbyOption[] = [
    ...recentOptions,
    ...records
      .filter((record) => !recentIds.has(nearbyShortId(record)))
      .map((record) => toOption(record, heading)),
  ];

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
      groupBy={(option) => option.group}
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
      onOpen={() => {
        setOpen(true);
        if (showRecent) setRecents(getRecentParents(nearbyType));
      }}
      onClose={() => setOpen(false)}
      inputValue={label}
      value={null}
      onInputChange={(_e, value, reason) => {
        if (reason !== 'reset') setLabel(value);
      }}
      onChange={(e, value) => {
        if (!value) return;
        // Enter on typed text (freeSolo "createOption") creates a new item –
        // or links an OSM url/id, which onCreateNew parses from the label.
        if (typeof value === 'string') {
          const exact = options.find(
            (option) =>
              toSearchText(option.label) === toSearchText(value.trim()),
          );
          if (exact) {
            void onSelectExisting(exact.shortId);
            return;
          }
          onCreateNew(e);
          return;
        }
        void onSelectExisting(value.shortId);
      }}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.label
      }
      isOptionEqualToValue={(option, value) =>
        typeof option !== 'string' &&
        typeof value !== 'string' &&
        option.shortId === value.shortId
      }
      filterOptions={(opts, state) =>
        opts.filter((option) => matchesQuery(option.label, state.inputValue))
      }
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
        />
      )}
    />
  );
};
