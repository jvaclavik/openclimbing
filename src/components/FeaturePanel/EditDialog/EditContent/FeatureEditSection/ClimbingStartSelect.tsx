import React from 'react';
import { AutocompleteSelect, Option } from './AutocompleteSelect';
import { useCurrentItem } from '../../context/EditContext';
import { t } from '../../../../../services/intl';
import {
  CLIMBING_START_OPTIONS,
  isClimbingTagSet,
} from '../../../../../services/tagging/climbing/climbingAttributes';
import { isClimbingRoute } from '../../../../../utils';

const KEY = 'climbing:start';

export const ClimbingStartSelect = () => {
  const { tags, setTag } = useCurrentItem();

  const isBoulder =
    isClimbingRoute(tags) && isClimbingTagSet(tags['climbing:boulder']);
  if (!isBoulder) return null;

  const options = CLIMBING_START_OPTIONS.map((opt) => ({
    label: t(opt.translationKey),
    value: opt.value,
  }));

  const value = options.find((opt) => opt.value === tags[KEY]) ?? null;

  const onChange = (_e, option: Option | null) => {
    setTag(KEY, option?.value ?? '');
  };

  return (
    <AutocompleteSelect
      values={options}
      label={t('climbing_start.label')}
      value={value}
      onChange={onChange}
      freeSolo
    />
  );
};
