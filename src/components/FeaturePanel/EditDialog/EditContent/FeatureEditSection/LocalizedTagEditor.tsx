import React, { useState } from 'react';
import {
  Box,
  IconButton,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TranslateIcon from '@mui/icons-material/Translate';
import { t } from '../../../../../services/intl';
import { useCurrentItem } from '../../context/EditContext';
import { TextFieldWithCharacterCount } from './helpers';
import { FeatureTags } from '../../../../../services/types';
import { TAG_LANGUAGE_FLAGS, TAG_LANGUAGES } from './tagLanguages';
import { useMoreMenu } from '../../../Climbing/useMoreMenu';

const CUSTOM_LANG = '__custom__';

/** ISO-like language suffix, e.g. `en`, `cs`, `zh-CN` — not `etymology`. */
const isLanguageSuffix = (suffix: string) =>
  /^[a-z]{2,3}(?:-[a-z0-9]+)?$/i.test(suffix);

export const isLocalizedTagKey = (baseKey: string, k: string) => {
  if (k === baseKey) return true;
  if (!k.startsWith(`${baseKey}:`)) return false;
  return isLanguageSuffix(k.slice(baseKey.length + 1));
};

export const getLocalizedTagLang = (baseKey: string, k: string) =>
  k === baseKey ? '' : k.slice(baseKey.length + 1);

export const buildLocalizedTagKey = (baseKey: string, lang: string) =>
  lang ? `${baseKey}:${lang}` : baseKey;

const getExistingKeys = (baseKey: string, tags: FeatureTags) =>
  Object.keys(tags).filter((k) => isLocalizedTagKey(baseKey, k));

const isKnownLang = (code: string) => code === '' || code in TAG_LANGUAGES;

const normalizeLangCode = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '');

const langLabel = (code: string) => {
  const flag = TAG_LANGUAGE_FLAGS[code] ?? '';
  return flag ? `${flag} ${code}` : code;
};

const nextCustomPlaceholder = (baseKey: string, slots: string[]) => {
  let n = 1;
  while (slots.includes(buildLocalizedTagKey(baseKey, `lang${n}`))) n += 1;
  return buildLocalizedTagKey(baseKey, `lang${n}`);
};

const AddTranslationMenu = ({ onAdd }: { onAdd: () => void }) => {
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClickMore}
        aria-label={t('editdialog.add_description_translation')}
        sx={{ flexShrink: 0, color: 'text.secondary' }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <MoreMenu>
        <MenuItem
          onClick={(e) => {
            handleCloseMore(e);
            onAdd();
          }}
        >
          <ListItemIcon>
            <TranslateIcon fontSize="small" />
          </ListItemIcon>
          {t('editdialog.add_description_translation')}
        </MenuItem>
      </MoreMenu>
    </>
  );
};

type LangSelectProps = {
  lang: string;
  usedLangs: Set<string>;
  customDraft: string;
  isEditingCustom: boolean;
  onDraftChange: (value: string) => void;
  onApplyCustom: (raw: string) => void;
  onLangChange: (value: string) => void;
};

const LocalizedTagLangSelect = ({
  lang,
  usedLangs,
  customDraft,
  isEditingCustom,
  onDraftChange,
  onApplyCustom,
  onLangChange,
}: LangSelectProps) => {
  const isCustom = !isKnownLang(lang);
  const showCustomInput = isEditingCustom || isCustom;
  const selectValue = showCustomInput ? CUSTOM_LANG : lang;

  return (
    <Stack
      direction="row"
      spacing={0.5}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      sx={{
        alignItems: 'center',
      }}
    >
      {showCustomInput ? (
        <TextField
          size="small"
          variant="standard"
          autoFocus={isEditingCustom}
          value={customDraft}
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={() => onApplyCustom(customDraft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onApplyCustom(customDraft);
            }
          }}
          placeholder={t('editdialog.description_lang_custom_code')}
          title={t('editdialog.description_lang_custom')}
          sx={{
            width: 48,
            '& .MuiInput-input': {
              fontSize: '0.75rem',
              py: 0.5,
              textAlign: 'center',
            },
          }}
          slotProps={{
            htmlInput: {
              maxLength: 12,
              'aria-label': t('editdialog.description_lang_custom'),
            },
          }}
        />
      ) : null}
      <Select
        size="small"
        value={selectValue}
        onChange={(e: SelectChangeEvent) => onLangChange(e.target.value)}
        displayEmpty
        variant="standard"
        disableUnderline
        title={t('editdialog.description_lang')}
        renderValue={(value) => {
          if (!value) {
            return (
              <Typography
                variant="caption"
                component="span"
                sx={{
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                —
              </Typography>
            );
          }
          if (value === CUSTOM_LANG) {
            return (
              <Typography
                variant="caption"
                component="span"
                sx={{
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                …
              </Typography>
            );
          }
          return (
            <Box component="span" sx={{ whiteSpace: 'nowrap', fontSize: 16 }}>
              {TAG_LANGUAGE_FLAGS[value] ?? value}
            </Box>
          );
        }}
        sx={{
          minWidth: 36,
          color: 'text.secondary',
          '& .MuiSelect-select': {
            py: 0.25,
            pr: '20px !important',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
          },
        }}
        MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
      >
        <MenuItem value="">
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            {t('editdialog.description_lang_default')}
          </Typography>
        </MenuItem>
        {Object.entries(TAG_LANGUAGES).map(([code, name]) => (
          <MenuItem
            key={code}
            value={code}
            disabled={usedLangs.has(code) && code !== lang}
            sx={{ whiteSpace: 'nowrap' }}
          >
            <Typography variant="caption" component="span">
              {langLabel(code)}
            </Typography>
            <Typography
              variant="caption"
              component="span"
              sx={{
                color: 'text.secondary',
                ml: 1,
              }}
            >
              {name}
            </Typography>
          </MenuItem>
        ))}
        <MenuItem value={CUSTOM_LANG} sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="caption" component="span">
            {t('editdialog.description_lang_custom')}
          </Typography>
        </MenuItem>
      </Select>
    </Stack>
  );
};

type RowActionsProps = {
  onAddTranslation?: () => void;
  onRemove: () => void;
};

const LocalizedTagRowActions = ({
  onAddTranslation,
  onRemove,
}: RowActionsProps) => (
  <>
    {onAddTranslation ? <AddTranslationMenu onAdd={onAddTranslation} /> : null}
    <IconButton
      size="small"
      onClick={onRemove}
      aria-label="remove"
      sx={{ flexShrink: 0, color: 'text.secondary' }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  </>
);

type Props = {
  baseKey: string;
  label: string;
  autoFocus?: boolean;
  helperText?: string;
  onEmpty?: () => void;
  multiline?: boolean;
};

export const LocalizedTagEditor: React.FC<Props> = ({
  baseKey,
  label,
  autoFocus,
  helperText,
  onEmpty,
  multiline,
}) => {
  const { tags, setTag, tagsEntries, setTagsEntries } = useCurrentItem();
  const [slots, setSlots] = useState<string[]>(() => {
    const existing = getExistingKeys(baseKey, tags);
    return existing.length ? existing : [baseKey];
  });
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const [editingCustomFor, setEditingCustomFor] = useState<string | null>(null);

  const usedLangs = new Set(
    slots.map((key) => getLocalizedTagLang(baseKey, key)),
  );

  const renameKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || slots.includes(newKey)) return false;
    const value = tags[oldKey] ?? '';
    setTagsEntries((prev) => {
      const filtered = prev.filter(([k]) => k !== oldKey && k !== newKey);
      return [...filtered, [newKey, value]];
    });
    setSlots((prev) => prev.map((k) => (k === oldKey ? newKey : k)));
    setCustomDrafts((prev) => {
      if (!(oldKey in prev)) return prev;
      const { [oldKey]: draft, ...rest } = prev;
      return { ...rest, [newKey]: draft };
    });
    setEditingCustomFor((prev) => (prev === oldKey ? newKey : prev));
    return true;
  };

  const removeSlot = (key: string) => {
    const index = tagsEntries.findIndex(([k]) => k === key);
    if (index !== -1) {
      setTagsEntries((prev) => prev.toSpliced(index, 1));
    }
    setSlots((prev) => {
      const next = prev.filter((k) => k !== key);
      if (next.length === 0) onEmpty?.();
      return next;
    });
    setCustomDrafts((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
    setEditingCustomFor((prev) => (prev === key ? null : prev));
  };

  const addSlot = () => {
    if (!slots.includes(baseKey)) {
      setSlots((prev) => [...prev, baseKey]);
      return;
    }
    const nextLang = Object.keys(TAG_LANGUAGES).find(
      (lang) => !usedLangs.has(lang),
    );
    if (nextLang) {
      setSlots((prev) => [...prev, buildLocalizedTagKey(baseKey, nextLang)]);
      return;
    }
    const key = nextCustomPlaceholder(baseKey, slots);
    setSlots((prev) => [...prev, key]);
    setEditingCustomFor(key);
    setCustomDrafts((prev) => ({ ...prev, [key]: '' }));
  };

  const applyCustomLang = (key: string, raw: string) => {
    const code = normalizeLangCode(raw);
    if (!code) return;
    if (usedLangs.has(code) && getLocalizedTagLang(baseKey, key) !== code) {
      return;
    }
    if (renameKey(key, buildLocalizedTagKey(baseKey, code))) {
      setEditingCustomFor(null);
    }
  };

  const onLangChange = (key: string, value: string) => {
    if (value === CUSTOM_LANG) {
      const lang = getLocalizedTagLang(baseKey, key);
      setCustomDrafts((prev) => ({
        ...prev,
        [key]: isKnownLang(lang) ? '' : lang,
      }));
      setEditingCustomFor(key);
      return;
    }
    setEditingCustomFor((prev) => (prev === key ? null : prev));
    renameKey(key, buildLocalizedTagKey(baseKey, value));
  };

  return (
    <Box>
      {slots.map((key, index) => {
        const lang = getLocalizedTagLang(baseKey, key);
        return (
          <Stack
            key={key}
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: 'center',
              mb: index === slots.length - 1 ? 0 : 2,
            }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <TextFieldWithCharacterCount
                label={label}
                k={key}
                autoFocus={autoFocus && index === 0}
                onChange={(e) => setTag(key, e.target.value)}
                value={tags[key] ?? ''}
                helperText={index === 0 ? helperText : undefined}
                multiline={multiline}
                endAdornment={
                  <LocalizedTagLangSelect
                    lang={lang}
                    usedLangs={usedLangs}
                    customDraft={customDrafts[key] ?? lang}
                    isEditingCustom={editingCustomFor === key}
                    onDraftChange={(value) =>
                      setCustomDrafts((prev) => ({ ...prev, [key]: value }))
                    }
                    onApplyCustom={(raw) => applyCustomLang(key, raw)}
                    onLangChange={(value) => onLangChange(key, value)}
                  />
                }
              />
            </Box>
            <LocalizedTagRowActions
              onAddTranslation={index === 0 ? addSlot : undefined}
              onRemove={() => removeSlot(key)}
            />
          </Stack>
        );
      })}
    </Box>
  );
};
