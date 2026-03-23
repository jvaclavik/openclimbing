import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { t } from '../../../../../services/intl';
import {
  getNextWikimediaCommonsIndex,
  getWikimediaCommonsKey,
} from '../../../Climbing/utils/photo';
import { useEditDialogContext } from '../../../helpers/EditDialogContext';
import {
  isClimbingCragOrArea as isClimbingCragOrAreaFn,
  isClimbingRoute as isClimbingRouteFn,
} from '../../../../../utils';
import { useCurrentItem } from '../../context/EditContext';
import { MajorKeysFieldList } from './MajorKeysFieldList';
import { MajorKeysInactivePicker } from './MajorKeysInactivePicker';
import { FeatureTags } from '../../../../../services/types';

const basicMajorKeys = ['name', 'description', 'website'];
const nonClimbingMajorKeys = ['phone', 'opening_hours'];
const climbingRouteMajorKeys = ['author', 'climbing:length'];
export const majorKeys = [...basicMajorKeys, ...nonClimbingMajorKeys];

const getData = (numberOfWikimediaItems: number, tags: FeatureTags) => {
  const isClimbingCragOrArea = isClimbingCragOrAreaFn(tags);
  const isClimbingRoute = isClimbingRouteFn(tags);
  const isClimbing = isClimbingCragOrArea || isClimbingRoute;

  const wikimediaCommonTags = Array(numberOfWikimediaItems)
    .fill('')
    .reduce((acc, _, index) => {
      const key = getWikimediaCommonsKey(index);
      const value = `${t('tags.wikimedia_commons_photo')} (${index})`;
      return { ...acc, [key]: value };
    }, {});

  return {
    keys: [
      ...basicMajorKeys,
      ...(isClimbing ? [] : nonClimbingMajorKeys),
      ...Object.keys(wikimediaCommonTags),
      ...(isClimbingRoute ? climbingRouteMajorKeys : []),
    ],
    names: {
      name: t('tags.name'),
      description: t('tags.description'),
      website: t('tags.website'),
      ...(isClimbing
        ? {}
        : {
            phone: t('tags.phone'),
            opening_hours: t('tags.opening_hours'),
          }),
      ...wikimediaCommonTags,
      ...(isClimbingRoute
        ? {
            author: t('tags.author'),
            'climbing:length': t('tags.climbing_length'),
          }
        : {}),
    },
  };
};

const getMajorKeyHelperText = (k: string) => {
  if (k === 'description') {
    return t('editdialog.description_helper_text');
  }
  return undefined;
};

export const MajorKeysEditor: React.FC = () => {
  const { focusTag } = useEditDialogContext();
  const { tags, setTag } = useCurrentItem();

  const nextWikimediaCommonsIndex = getNextWikimediaCommonsIndex(tags);

  const data = getData(nextWikimediaCommonsIndex + 1, tags);

  const [activeMajorKeys, setActiveMajorKeys] = useState(() =>
    data.keys.filter((k) => !!tags[k]),
  );

  const inactiveMajorKeys = data.keys.filter(
    (k) =>
      !activeMajorKeys.includes(k) ||
      k === getWikimediaCommonsKey(nextWikimediaCommonsIndex + 1),
  );

  useEffect(() => {
    if (focusTag === 'name' && !activeMajorKeys.includes('name')) {
      setActiveMajorKeys((arr) => [...arr, 'name']);
    }
  }, [activeMajorKeys, focusTag]);

  return (
    <Box mb={3}>
      <MajorKeysFieldList
        data={data}
        tags={tags}
        activeMajorKeys={activeMajorKeys}
        setActiveMajorKeys={setActiveMajorKeys}
        focusTag={focusTag}
        setTag={setTag}
        getHelperText={getMajorKeyHelperText}
      />

      <MajorKeysInactivePicker
        inactiveMajorKeys={inactiveMajorKeys}
        names={data.names}
        onAdd={(k) => setActiveMajorKeys((arr) => [...arr, k])}
      />
    </Box>
  );
};
