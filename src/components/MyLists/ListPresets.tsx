import React from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import { t } from '../../services/intl';

type Preset = {
  nameKey:
    | 'mylists.presets.favorites'
    | 'mylists.presets.want_to_visit'
    | 'mylists.presets.want_to_climb';
  emoji: string;
};

const PRESETS: Preset[] = [
  { nameKey: 'mylists.presets.favorites', emoji: '⭐' },
  { nameKey: 'mylists.presets.want_to_visit', emoji: '🚩' },
  { nameKey: 'mylists.presets.want_to_climb', emoji: '🧗' },
];

type Props = {
  existingNames: string[];
  onSelect: (name: string, emoji: string) => void | Promise<void>;
  disabled?: boolean;
};

export const ListPresets = ({ existingNames, onSelect, disabled }: Props) => {
  const lowerExisting = new Set(
    existingNames.map((n) => n.trim().toLowerCase()),
  );
  const available = PRESETS.map((p) => ({ ...p, name: t(p.nameKey) })).filter(
    (p) => !lowerExisting.has(p.name.trim().toLowerCase()),
  );

  if (available.length === 0) {
    return null;
  }

  return (
    <Stack direction="column" gap={0.5} mb={1.5}>
      <Typography variant="caption" color="text.secondary">
        {t('mylists.quick_presets')}
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {available.map((p) => (
          <Chip
            key={p.nameKey}
            label={`${p.emoji} ${p.name}`}
            variant="outlined"
            clickable
            disabled={disabled}
            onClick={() => onSelect(p.name, p.emoji)}
          />
        ))}
      </Stack>
    </Stack>
  );
};
