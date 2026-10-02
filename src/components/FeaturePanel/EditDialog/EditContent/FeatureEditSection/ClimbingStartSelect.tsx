import React from 'react';
import { AutocompleteSelect, Option } from './AutocompleteSelect';
import { useCurrentItem } from '../../context/EditContext';
import { useMultiEdit } from '../../context/useMultiEdit';
import { t } from '../../../../../services/intl';
import {
  CLIMBING_START_OPTIONS,
  isClimbingTagSet,
} from '../../../../../services/tagging/climbing/climbingAttributes';
import { isClimbingRoute } from '../../../../../utils';

const KEY = 'climbing:start';

export const ClimbingStartSelect = () => {
  const { tags } = useCurrentItem();
  const { tags: shared, mixed, setTag } = useMultiEdit();

  const isBoulder =
    isClimbingRoute(tags) && isClimbingTagSet(tags['climbing:boulder']);
  if (!isBoulder) return null;

  const options = CLIMBING_START_OPTIONS.map((opt) => ({
    label: t(opt.translationKey),
    value: opt.value,
  }));

  const isMixed = Object.prototype.hasOwnProperty.call(mixed, KEY);
  const raw = isMixed ? undefined : shared[KEY];
  const value = isMixed
    ? null
    : (options.find((opt) => opt.value === raw) ?? raw ?? null);

  const onChange = (_e, option: string | Option | null) => {
    setTag(KEY, (typeof option === 'string' ? option : option?.value) ?? '');
  };

  return (
    <AutocompleteSelect
      values={options}
      label={t('climbing_start.label')}
      value={value}
      onChange={onChange}
      freeSolo
      placeholder={isMixed ? t('editdialog.multiple_values') : undefined}
    />
  );
};
