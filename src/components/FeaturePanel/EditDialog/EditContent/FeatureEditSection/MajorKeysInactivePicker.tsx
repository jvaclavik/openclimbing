import React from 'react';
import { Button, Typography } from '@mui/material';
import { t } from '../../../../../services/intl';

type Props = {
  inactiveMajorKeys: string[];
  names: Record<string, string>;
  onAdd: (k: string) => void;
};

export const MajorKeysInactivePicker: React.FC<Props> = ({
  inactiveMajorKeys,
  names,
  onAdd,
}) => {
  if (!inactiveMajorKeys.length) return null;

  return (
    <>
      <Typography variant="body1" component="span" color="textSecondary">
        {t('editdialog.add_major_tag')}:
      </Typography>
      {inactiveMajorKeys.map((k) => (
        <Button key={k} size="small" onClick={() => onAdd(k)}>
          {names[k]}
        </Button>
      ))}
    </>
  );
};
