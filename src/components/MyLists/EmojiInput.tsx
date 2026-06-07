import React from 'react';
import { Box, IconButton, Stack, TextField } from '@mui/material';
import { t } from '../../services/intl';

const EMOJI_PRESETS = [
  '⭐',
  '❤️',
  '🚩',
  '🔖',
  '🏔️',
  '🧗',
  '📍',
  '✅',
  '🎯',
  '🔥',
  '💎',
  '☀️',
  '🌲',
  '⛺',
  '🥾',
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const EMOJI_RE = /\p{Extended_Pictographic}/u;

const firstEmojiGrapheme = (input: string): string => {
  if (!input) return '';
  const seg =
    typeof (Intl as any).Segmenter === 'function'
      ? new (Intl as any).Segmenter().segment(input)
      : null;
  if (seg) {
    for (const { segment } of seg) {
      if (EMOJI_RE.test(segment)) return segment;
    }
    return '';
  }
  const first = Array.from(input)[0] ?? '';
  return EMOJI_RE.test(first) ? first : '';
};

export const EmojiTextField = ({ value, onChange }: Props) => (
  <TextField
    size="small"
    label={t('mylists.emoji_placeholder')}
    value={value}
    onChange={(e) => onChange(firstEmojiGrapheme(e.target.value))}
    slotProps={{
      htmlInput: {
        maxLength: 8,
        style: { fontSize: 22, textAlign: 'center', width: 36 },
      },
    }}
    sx={{ width: 80, flexShrink: 0 }}
  />
);

export const EmojiPresets = ({ value, onChange }: Props) => (
  <Box display="flex" flexWrap="wrap" gap={0.5}>
    {EMOJI_PRESETS.map((emoji) => (
      <IconButton
        key={emoji}
        size="small"
        onClick={() => onChange(emoji)}
        sx={{
          fontSize: 18,
          width: 32,
          height: 32,
          outline:
            value === emoji ? '2px solid currentColor' : '1px solid #8884',
        }}
      >
        {emoji}
      </IconButton>
    ))}
  </Box>
);

export const EmojiInput = ({ value, onChange }: Props) => (
  <Stack direction="column" gap={1}>
    <EmojiTextField value={value} onChange={onChange} />
    <EmojiPresets value={value} onChange={onChange} />
  </Stack>
);
