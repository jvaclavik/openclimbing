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

  return (
    <EditContextProvider key={getReactKey(feature)}>
      {opened && <EditDialogBody />}
    </EditContextProvider>
  );
};
