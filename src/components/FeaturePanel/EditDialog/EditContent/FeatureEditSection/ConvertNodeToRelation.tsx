import { useCurrentItem, useEditContext } from '../../context/EditContext';
import { Alert, Button } from '@mui/material';
import { t } from '../../../../../services/intl';
import React from 'react';
import { FeatureTags } from '../../../../../services/types';
import { getApiId } from '../../../../../services/helpers';
import { useFeatureContext } from '../../../../utils/FeatureContext';
import { useSnackbar } from '../../../../utils/SnackbarContext';
import { AlreadyInCragError } from '../../context/convertToRelationFactory';

export const isConvertible = (shortId: string, tags: FeatureTags) => {
  if (shortId.startsWith('w')) return tags.climbing === 'crag';
  return shortId.startsWith('n') && ['crag', 'area'].includes(tags.climbing);
};

const convertDescription = (shortId: string, tags: FeatureTags) => {
  if (shortId.startsWith('w') && tags.climbing === 'crag') {
    return t('editdialog.members.climbing_crag_convert_way_description');
  }
  if (tags.natural === 'peak') {
    return t('editdialog.members.climbing_crag_convert_peak_description');
  }
  return tags.climbing === 'crag'
    ? t('editdialog.members.climbing_crag_convert_description')
    : t('editdialog.members.convert_description');
};

export const ConvertNodeToRelation = () => {
  const { setCurrent, removeItem } = useEditContext();
  const { shortId, tags, convertToRelation } = useCurrentItem();
  const { feature } = useFeatureContext();
  const { showToast } = useSnackbar();

  const handleConvertToRelation = async () => {
    try {
      const newShortId = await convertToRelation(feature?.center);
      setCurrent(newShortId);
      if (getApiId(shortId).id < 0) {
        removeItem(shortId);
      }
    } catch (error) {
      if (error instanceof AlreadyInCragError) {
        showToast(t('editdialog.members.convert_already_in_crag'), 'warning');
        return;
      }
      throw error;
    }
  };

  return (
    <Alert
      severity="info"
      icon={null}
      action={
        <Button
          onClick={handleConvertToRelation}
          color="inherit"
          variant="text"
          size="small"
        >
          {t('editdialog.members.convert_button')}
        </Button>
      }
    >
      {convertDescription(shortId, tags)}
    </Alert>
  );
};
