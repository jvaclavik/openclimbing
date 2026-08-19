import { useCurrentItem } from '../context/EditContext';
import { ItemHeading } from './FeatureEditSection/ItemHeading';
import { PlaceCancelledToggle } from './FeatureEditSection/OptionsEditor';
import { PresetSelect } from './FeatureEditSection/PresetSelect/PresetSelect';
import { MajorKeysEditor } from './FeatureEditSection/MajorKeysEditor';
import { TagsEditor } from './FeatureEditSection/TagsEditor/TagsEditor';
import {
  LocationEditor,
  MissingLocationBanner,
} from './FeatureEditSection/LocationEditor/LocationEditor';
import { ParentsEditor } from './FeatureEditSection/ParentsEditor';
import { MembersEditor } from './FeatureEditSection/MembersEditor/MembersEditor';
import React from 'react';
import { ClimbingEditor } from './FeatureEditSection/ClimbingEditor/ClimbingEditor';
import { Box } from '@mui/material';
import { EditSectionCard } from './EditSectionCard';

export const ItemEditSection = () => {
  const { toBeDeleted } = useCurrentItem();
  if (toBeDeleted) {
    return (
      <>
        <ItemHeading />
        <PlaceCancelledToggle />
      </>
    );
  }

  return (
    <>
      <ItemHeading />
      <MissingLocationBanner />
      <PresetSelect />
      <MajorKeysEditor />
      <ClimbingEditor />
      <EditSectionCard>
        <ParentsEditor />
        <MembersEditor />
      </EditSectionCard>
      <LocationEditor />
      <TagsEditor />
      <Box mt={4} />
    </>
  );
};
