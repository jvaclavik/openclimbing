import { HAS_USER_DB } from '../../../services/osm/consts';
import React from 'react';
import dynamic from 'next/dynamic';
import { useEditDialogContext } from '../helpers/EditDialogContext';
import { useEditDialogFeature } from './utils';
import { EditContextProvider } from './context/EditContext';
import { getReactKey } from '../../../services/helpers';

const EditDialogBody = dynamic(
  () => import('./EditDialogBody').then((m) => m.EditDialogBody),
  { ssr: false },
);

export const EditDialog = () => {
  const { opened } = useEditDialogContext();
  const { feature } = useEditDialogFeature();

  if (!HAS_USER_DB || !opened) return null;

  return (
    <EditContextProvider key={getReactKey(feature)}>
      <EditDialogBody />
    </EditContextProvider>
  );
};
