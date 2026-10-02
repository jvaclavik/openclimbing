import React from 'react';
import { Box } from '@mui/material';
import { OpeningHoursEditor } from './OpeningHoursEditor/OpeningHoursEditor';
import { TextFieldWithCharacterCount } from './helpers';
import { WikimediaCommonsGallery } from './WikimediaCommonsGallery';
import { DescriptionEditor, NameEditor } from './DescriptionEditor';
import { FeatureTags } from '../../../../../services/types';
import { t } from '../../../../../services/intl';
import { isWikimediaCommonsFileSlotKey } from '../../../Climbing/utils/photo';
import { mergeActiveMajorKeysAfterRemap } from './wikimediaCommonsGalleryModel';

type Data = {
  keys: string[];
  names: Record<string, string>;
};

type Props = {
  data: Data;
  tags: FeatureTags;
  activeMajorKeys: string[];
  setActiveMajorKeys: React.Dispatch<React.SetStateAction<string[]>>;
  focusTag: boolean | string;
  setTag: (k: string, v: string) => void;
  getHelperText: (k: string) => string | undefined;
  isMulti?: boolean;
  mixed?: Record<string, string[]>;
};

export const MajorKeysFieldList: React.FC<Props> = ({
  data,
  tags,
  activeMajorKeys,
  setActiveMajorKeys,
  focusTag,
  setTag,
  getHelperText,
  isMulti,
  mixed,
}) => {
  const getInputElement = (k: string) => {
    if (!data.keys?.includes(k)) return null;

    const mixedValues =
      mixed && Object.prototype.hasOwnProperty.call(mixed, k)
        ? mixed[k]
        : undefined;
    const isMixed = !!isMulti && mixedValues !== undefined;
    const helperText =
      isMixed && mixedValues.length
        ? t('editdialog.multiple_values_list', {
            values: mixedValues.join(', '),
          })
        : getHelperText(k);

    if (!isMulti && k === 'opening_hours') {
      return <OpeningHoursEditor />;
    }

    if (!isMulti && k === 'name') {
      return (
        <NameEditor
          autoFocus={focusTag === k}
          helperText={getHelperText(k)}
          onEmpty={() =>
            setActiveMajorKeys((prev) => prev.filter((key) => key !== k))
          }
        />
      );
    }

    if (!isMulti && k === 'description') {
      return (
        <DescriptionEditor
          autoFocus={focusTag === k}
          helperText={getHelperText(k)}
          onEmpty={() =>
            setActiveMajorKeys((prev) => prev.filter((key) => key !== k))
          }
        />
      );
    }

    return (
      <TextFieldWithCharacterCount
        label={data.names[k]}
        k={k}
        autoFocus={focusTag === k}
        onChange={(e) => {
          setTag(e.target.name, e.target.value);
        }}
        value={isMixed ? '' : (tags[k] ?? '')}
        placeholder={isMixed ? t('editdialog.multiple_values') : undefined}
        helperText={helperText}
        multiline={k === 'name' ? false : undefined}
      />
    );
  };

  const wikimediaFileKeys = activeMajorKeys.filter(
    isWikimediaCommonsFileSlotKey,
  );
  let wikimediaGalleryInserted = false;

  return (
    <>
      {activeMajorKeys.flatMap((k) => {
        if (isMulti && isWikimediaCommonsFileSlotKey(k)) return [];
        if (isWikimediaCommonsFileSlotKey(k)) {
          if (!wikimediaGalleryInserted && wikimediaFileKeys.length) {
            wikimediaGalleryInserted = true;
            return [
              <Box
                key="__wikimedia_commons_gallery__"
                sx={{
                  mb: 2,
                }}
              >
                <WikimediaCommonsGallery
                  fileKeys={wikimediaFileKeys}
                  onFileKeysChange={(next) =>
                    setActiveMajorKeys((prev) =>
                      mergeActiveMajorKeysAfterRemap(prev, next),
                    )
                  }
                />
              </Box>,
            ];
          }
          return [];
        }
        return [
          <Box
            key={k}
            sx={{
              mb: 2,
            }}
          >
            {getInputElement(k)}
          </Box>,
        ];
      })}
    </>
  );
};
