import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  List,
  ListItemButton,
  Paper,
  Popper,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { t } from '../../../services/intl';

type PartnersTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  label: string;
  helperText: string;
  placeholder?: string;
  onFillFromLastRoute?: () => void;
  fillFromLastRouteDisabled?: boolean;
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
  onFillFromLastRoute,
  fillFromLastRouteDisabled,
}: PartnersTextFieldProps) => {
  const [cursorPos, setCursorPos] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const showList = Boolean(mention && filtered.length > 0);
  const showEmptyHint = Boolean(
    mention && filtered.length === 0 && suggestions.length === 0,
  );
  const popperOpen = showList || showEmptyHint;

  const fillButton = onFillFromLastRoute ? (
    <Tooltip
      disableHoverListener={!fillFromLastRouteDisabled}
      title={t('tick.partners_from_last_route_none')}
    >
      <span>
        <Button
          size="small"
          variant="outlined"
          startIcon={<HistoryIcon fontSize="small" />}
          onClick={onFillFromLastRoute}
          disabled={fillFromLastRouteDisabled}
        >
          {t('tick.partners_from_last_route')}
        </Button>
      </span>
    </Tooltip>
  ) : null;

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box
          component="span"
          sx={{ typography: 'body2', color: 'text.secondary' }}
        >
          {label}
        </Box>
        {fillButton}
      </Box>
      <Box ref={setAnchorEl}>
        <TextField
          helperText={helperText}
          placeholder={placeholder}
          value={value}
          multiline
          minRows={2}
          fullWidth
          hiddenLabel
          aria-label={label}
          onChange={(e) => {
            onChange(e.target.value);
            setCursorPos(e.target.selectionStart ?? 0);
          }}
          onSelect={(e) => syncCursor(e.target as HTMLTextAreaElement)}
          onClick={(e) => syncCursor(e.target as HTMLTextAreaElement)}
          onKeyUp={(e) => syncCursor(e.target as HTMLTextAreaElement)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <Popper
        open={popperOpen && Boolean(anchorEl)}
        anchorEl={anchorEl}
        placement="bottom-start"
        disablePortal={false}
        modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}
        sx={(theme) => ({
          zIndex: theme.zIndex.modal + 2,
        })}
      >
        {showList ? (
          <Paper
            elevation={8}
            sx={{
              width: anchorEl ? anchorEl.offsetWidth : undefined,
              maxHeight: 220,
              overflow: 'auto',
              mt: 0.5,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <List dense disablePadding>
              {filtered.map((s) => (
                <ListItemButton key={s} onMouseDown={() => insertMention(s)}>
                  @{s}
                </ListItemButton>
              ))}
            </List>
          </Paper>
        ) : null}
        {showEmptyHint ? (
          <Paper
            elevation={8}
            variant="outlined"
            sx={{
              width: anchorEl ? anchorEl.offsetWidth : undefined,
              mt: 0.5,
              p: 1.5,
              typography: 'body2',
              color: 'text.secondary',
            }}
          >
            {t('tick.partners_no_suggestions')}
          </Paper>
        ) : null}
      </Popper>
    </Stack>
  );
};
