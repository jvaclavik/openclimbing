import React, { useEffect, useRef } from 'react';
import { AutocompleteRenderInputParams } from '@mui/material/Autocomplete/Autocomplete';
import { useFocusOnCmdK, useFocusOnSlash } from '../../helpers/hooks';
import { InputBase } from '@mui/material';
import { t } from '../../services/intl';
import { Setter } from '../../types';

type SearchBoxInputProps = {
  params: AutocompleteRenderInputParams;
  setInputValue: Setter<string>;
  autocompleteRef: React.MutableRefObject<undefined>;
  autoFocus?: boolean;
};

// iOS Safari zooms the whole page in when a focused <input> has a font-size
// below 16px. Because the map owns pinch-zoom, the user then can't zoom back
// out and gets stuck (#209). Rendering the search input at 16px on touch
// devices prevents that auto-zoom, and avoids `user-scalable=no` (which harms
// accessibility). Pointer (desktop) devices keep the compact 14px design.
export const searchInputSx = {
  height: '100%',
  fontSize: 14,
  '@media (hover: none) and (pointer: coarse)': { fontSize: 16 },
} as const;

const SearchBoxInput = ({
  params,
  setInputValue,
  autocompleteRef,
  autoFocus,
}: SearchBoxInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusOnSlash(inputRef);
  useFocusOnCmdK(inputRef);

  const { slotProps, ...restParams } = params;
  const htmlInput = slotProps.htmlInput;

  useEffect(() => {
    const ref = slotProps.input.ref;
    if (typeof ref === 'function') {
      ref(autocompleteRef.current);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <InputBase
      {...restParams} // eslint-disable-line react/jsx-props-no-spreading
      sx={searchInputSx}
      inputRef={inputRef}
      autoFocus={autoFocus}
      placeholder={t('searchbox.placeholder')}
      inputProps={htmlInput}
      onChange={({ target }) => setInputValue(target.value)}
      onFocus={({ target }) => target.select()}
    />
  );
};

export const renderInputFactory = (
  setInputValue: Setter<string>,
  autocompleteRef: React.MutableRefObject<undefined>,
  autoFocus?: boolean,
) => {
  const renderInputFn = (params: AutocompleteRenderInputParams) => (
    <SearchBoxInput
      params={params}
      setInputValue={setInputValue}
      autocompleteRef={autocompleteRef}
      autoFocus={autoFocus}
    />
  );
  return renderInputFn;
};
