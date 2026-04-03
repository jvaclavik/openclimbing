import React, { useCallback, useState } from 'react';
import { List, ListItemButton, Paper, TextField } from '@mui/material';
import { t } from '../../../services/intl';

type PartnersTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  label: string;
  helperText: string;
  placeholder?: string;
};

function getActiveMention(
  text: string,
  cursorPos: number,
): { start: number; query: string } | null {
  const textBefore = text.slice(0, cursorPos);
  const atIndex = textBefore.lastIndexOf('@');
  if (atIndex === -1) {
    return null;
  }
  const afterAt = textBefore.slice(atIndex + 1);
  if (/\s/.test(afterAt)) {
    return null;
  }
  return { start: atIndex, query: afterAt };
}

export const PartnersTextField = ({
  value,
  onChange,
  suggestions,
  label,
  helperText,
  placeholder,
}: PartnersTextFieldProps) => {
  const [cursorPos, setCursorPos] = useState(0);

  const mention = getActiveMention(value, cursorPos);

  const filtered = !mention
    ? []
    : suggestions
        .filter((s) => s.toLowerCase().startsWith(mention.query.toLowerCase()))
        .slice(0, 8);

  const syncCursor = (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    if (el) {
      setCursorPos(el.selectionStart ?? 0);
    }
  };

  const insertMention = useCallback(
    (name: string) => {
      const act = getActiveMention(value, cursorPos);
      if (!act) {
        return;
      }
      const before = value.slice(0, act.start);
      const after = value.slice(cursorPos);
      const next = `${before}@${name} ${after}`;
      onChange(next);
      setCursorPos(act.start + name.length + 2);
    },
    [onChange, value, cursorPos],
  );

  return (
    <>
      <TextField
        label={label}
        helperText={helperText}
        placeholder={placeholder}
        value={value}
        multiline
        minRows={2}
        fullWidth
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPos(e.target.selectionStart ?? 0);
        }}
        onSelect={(e) => syncCursor(e.target as HTMLTextAreaElement)}
        onClick={(e) => syncCursor(e.target as HTMLTextAreaElement)}
        onKeyUp={(e) => syncCursor(e.target as HTMLTextAreaElement)}
        InputLabelProps={{ shrink: true }}
      />
      {mention && filtered.length > 0 && (
        <Paper elevation={2} sx={{ mt: 0.5, maxHeight: 200, overflow: 'auto' }}>
          <List dense disablePadding>
            {filtered.map((s) => (
              <ListItemButton key={s} onMouseDown={() => insertMention(s)}>
                @{s}
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
      {mention && filtered.length === 0 && suggestions.length === 0 && (
        <Paper elevation={0} sx={{ mt: 0.5, p: 1, bgcolor: 'action.hover' }}>
          {t('tick.partners_no_suggestions')}
        </Paper>
      )}
    </>
  );
};
