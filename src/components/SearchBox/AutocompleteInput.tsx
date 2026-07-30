import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete } from '@mui/material';
import { renderOptionFactory } from './renderOptionFactory';
import { useGetOnSelected } from './useGetOnSelected';
import { useGetOnHighlight } from './useGetOnHighlight';
import { getOptionLabel } from './getOptionLabel';
import { useGetOptions } from './useGetOptions';
import { OptionsPaper, OptionsPopper } from './optionsPopper';
import { AutocompleteProps } from '@mui/material/Autocomplete/Autocomplete';
import { Option } from './types';
import { renderInputFactory } from './renderInputFactory';
import { useHandleDirectQuery } from './useHandleDirectQuery';
import { Setter } from '../../types';
import {
  setUrlQuery,
  useHandleQuery,
  useInputValueWithUrl,
} from './useHandleQuery';
import { useFeatureContext } from '../utils/FeatureContext';
import { useMapStateContext } from '../utils/MapStateContext';
import { usePoiCategoriesContext } from '../utils/PoiCategoriesContext';
import { buildPoiCategoryOptions } from './options/poiCategories';

const AutocompleteConfigured = (
  props: AutocompleteProps<Option, false, true, true>,
) => (
  <Autocomplete
    value={null} // we need value=null to be able to select the same again (eg. fire same category search again)
    autoComplete
    disableClearable
    autoHighlight
    clearOnEscape
    slots={{ paper: OptionsPaper, popper: OptionsPopper }}
    {...props} // eslint-disable-line react/jsx-props-no-spreading
  />
);

type AutocompleteInputProps = {
  autocompleteRef: React.MutableRefObject<undefined>;
  setIsLoading: Setter<boolean>;
};

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  autocompleteRef,
  setIsLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { inputValue, valueRef, setInputValue, lastSyncedValue } =
    useInputValueWithUrl();
  const searchOptions = useGetOptions(inputValue, valueRef);
  const onHighlight = useGetOnHighlight();
  const onSelected = useGetOnSelected(setIsLoading);
  const { setPreview } = useFeatureContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const { view } = useMapStateContext();
  const { activeKeys, toggleCategory, clearCategories, openRequest, status } =
    usePoiCategoriesContext();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // An empty input shows the POI category browser instead of search results
  const isCategoryMode = inputValue === '';
  const categoryOptions = useMemo(
    () =>
      isCategoryMode
        ? buildPoiCategoryOptions({
            activeKeys,
            expandedGroups,
            zoom: parseFloat(view[0]),
            status,
          })
        : [],
    [activeKeys, expandedGroups, isCategoryMode, status, view],
  );

  useHandleDirectQuery(onSelected, setInputValue, setIsLoading);
  useHandleQuery(setInputValue, setIsOpen, lastSyncedValue);

  useEffect(() => {
    if (openRequest > 0) {
      setInputValue('');
      setIsOpen(true);
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest]);

  const handleChange = (event, option: Option) => {
    if (option.type === 'poiGroup') {
      const { groupKey } = option.poiGroup;
      setExpandedGroups((current) =>
        current.includes(groupKey)
          ? current.filter((key) => key !== groupKey)
          : [...current, groupKey],
      );
      return;
    }
    if (option.type === 'poiCategory') {
      toggleCategory(option.poiCategory.categoryKey);
      return;
    }
    if (option.type === 'poiClear') {
      clearCategories();
      return;
    }
    onSelected(event, option);
  };

  return (
    <AutocompleteConfigured
      open={isOpen}
      onClose={(_event, reason) => {
        setIsOpen(false);
        // On 'selectOption' the user picked a result and onSelected() is
        // already navigating to it. Re-arming the debounced URL sync here would
        // fire Router.push('/') ~800 ms later and abort that navigation — the
        // loader runs, vanishes, and the panel never opens. So only sync the
        // (cleared) query to the URL when the dropdown closes without a pick.
        if (reason !== 'selectOption') {
          setUrlQuery('', lastSyncedValue);
        }
        setPreview(null);
      }}
      onOpen={() => {
        setIsOpen(true);
        setUrlQuery(inputValue, lastSyncedValue);
      }}
      inputValue={inputValue}
      options={isCategoryMode ? categoryOptions : searchOptions}
      getOptionLabel={getOptionLabel}
      onChange={handleChange}
      disableCloseOnSelect={isCategoryMode} // toggling categories keeps the list open
      onHighlightChange={onHighlight}
      renderOption={renderOptionFactory(inputValue)}
      renderInput={renderInputFactory(setInputValue, autocompleteRef, inputRef)}
      filterOptions={(option) => option}
      getOptionDisabled={(option) =>
        option.type === 'loader' ||
        option.type === 'separator' ||
        option.type === 'poiStatus'
      }
      getOptionKey={(option) => JSON.stringify(option)}
    />
  );
};
