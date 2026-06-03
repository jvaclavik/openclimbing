import { Box, Button } from '@mui/material';
import styled from '@emotion/styled';
import EditIcon from '@mui/icons-material/Edit';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import React from 'react';
import { t } from '../../services/intl';
import { useEditDialogContext } from './helpers/EditDialogContext';
import { useEditDialogFeature } from './EditDialog/utils';

// When this button lives inside a narrow @container (e.g. shrunk climbing
// side panel), collapse it to an icon-only button.
const ResponsiveButton = styled(Button)`
  @container (max-width: 220px) {
    min-width: 0;
    padding: 8px;
    & .MuiButton-startIcon {
      margin: 0;
    }
  }
`;

const ButtonText = styled.span`
  @container (max-width: 220px) {
    display: none;
  }
`;

const getLabel = (isAddPlace: boolean, isUndelete: boolean) => {
  if (isAddPlace) return t('featurepanel.add_place_button');
  if (isUndelete) return t('featurepanel.undelete_button');
  return t('featurepanel.edit_button');
};

export const EditButton = () => {
  const { isAddPlace, isUndelete } = useEditDialogFeature();
  const { open } = useEditDialogContext();

  return (
    <Box mt={3} mb={3} mx="auto" sx={{ textAlign: 'center' }}>
      <ResponsiveButton
        size="large"
        startIcon={
          isAddPlace || isUndelete ? <AddLocationIcon /> : <EditIcon />
        }
        variant="outlined"
        color="primary"
        onClick={open}
      >
        <ButtonText>{getLabel(isAddPlace, isUndelete)}</ButtonText>
      </ResponsiveButton>
    </Box>
  );
};
