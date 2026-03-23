import React from 'react';
import { Box } from '@mui/material';
import { OpeningHoursEditor } from './OpeningHoursEditor/OpeningHoursEditor';
import { TextFieldWithCharacterCount } from './helpers';
import { WikimediaCommonsGallery } from './WikimediaCommonsGallery';
import { FeatureTags } from '../../../../../services/types';
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
};

export const MajorKeysFieldList: React.FC<Props> = ({
  data,
  tags,
  activeMajorKeys,
  setActiveMajorKeys,
  focusTag,
  setTag,
  getHelperText,
}) => {
  const getInputElement = (k: string) => {
    if (!data.keys?.includes(k)) return null;

    if (k === 'opening_hours') {
      return <OpeningHoursEditor />;
    }

    return (
      <TextFieldWithCharacterCount
        label={data.names[k]}
        k={k}
        autoFocus={focusTag === k}
        onChange={(e) => {
          setTag(e.target.name, e.target.value);
        }}
        value={tags[k] ?? ''}
        helperText={getHelperText(k)}
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
        if (isWikimediaCommonsFileSlotKey(k)) {
          if (!wikimediaGalleryInserted && wikimediaFileKeys.length) {
            wikimediaGalleryInserted = true;
            return [
              <Box key="__wikimedia_commons_gallery__" mb={2}>
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
          <Box key={k} mb={2}>
            {getInputElement(k)}
          </Box>,
        ];
      })}
    </>
  );
};
