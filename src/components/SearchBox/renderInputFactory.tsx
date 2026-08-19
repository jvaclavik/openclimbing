import { useRef } from 'react';
import React, { useEffect } from 'react';
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

  useEffect(() => {
    const ref = slotProps.input.ref;
    if (typeof ref === 'function') {
      ref(autocompleteRef.current);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <InputBase
      {...restParams} // eslint-disable-line react/jsx-props-no-spreading
      sx={{ height: '100%', fontSize: 14 }}
      inputRef={inputRef}
      autoFocus={autoFocus}
      placeholder={t('searchbox.placeholder')}
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
