import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { t } from '../../../../../../services/intl';
import { searchCategoryPrefix } from '../../../../../../services/wikimedia/api';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  helperText?: string;
};

const SEARCH_DEBOUNCE_MS = 250;

export const CategoriesAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  disabled,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const requestId = ++requestRef.current;
    const handle = window.setTimeout(async () => {
      try {
        const results = await searchCategoryPrefix(trimmed);
        if (requestRef.current === requestId) setOptions(results);
      } finally {
        if (requestRef.current === requestId) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [inputValue]);

  const handleChange = (_: unknown, next: string[]) => {
    // Map each free-text entry to its canonical option (case-insensitive)
    // so users typing "climbing in spain" end up with "Climbing in Spain".
    const canonicalByLower = new Map<string, string>();
    options.forEach((opt) => canonicalByLower.set(opt.toLowerCase(), opt));

    const normalized = next
      .map((raw) => raw.replace(/^Category:/, '').trim())
      .filter(Boolean)
      .map((entry) => canonicalByLower.get(entry.toLowerCase()) ?? entry);

    const deduped = Array.from(new Set(normalized));
    onChange(deduped);
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      autoSelect
      filterSelectedOptions
      disabled={disabled}
      options={options}
      value={value}
      loading={loading}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(_, next) => setInputValue(next)}
      renderTags={(tags, getTagProps) =>
        tags.map((tag, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          return <Chip key={key} {...chipProps} label={tag} size="small" />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('uploaddialog.category_label')}
          helperText={helperText}
          placeholder={t('uploaddialog.category_placeholder')}
        />
      )}
    />
  );
};
