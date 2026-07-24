import React from 'react';
import { Button } from '@mui/material';
import { t } from '../../../services/intl';

export const EditTickButton = (props: { onClick: () => void }) => (
  <Button color="inherit" size="small" onClick={props.onClick}>
    {t('tick.edit_button')}
  </Button>
);
