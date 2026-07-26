import { Button } from '@mui/material';
import React from 'react';
import { t } from '../../../../services/intl';
import { useEditContext } from '../context/EditContext';
import { getDiffXml } from '../../../../services/osm/auth/getDIffXml';

const downloadFile = (content: string, filename: string) => {
  const file = new Blob([content], { type: 'text/xml' });
  const element = document.createElement('a');
  element.style.display = 'none';
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const DownloadEditButton = () => {
  const { items } = useEditContext();
  const isModified = items.some(({ modified }) => modified);

  if (!isModified) return null;

  const download = () => {
    downloadFile(getDiffXml(items), 'changes.osc');
  };

  return (
    <Button
      variant="text"
      color="secondary"
      sx={{ fontSize: '11px', textTransform: 'none', alignSelf: 'flex-start' }}
      onClick={download}
    >
      {t('editdialog.download_osc')}
    </Button>
  );
};
