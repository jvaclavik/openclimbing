import { t } from '../../../../../../services/intl';
import { TranslationId } from '../../../../../../services/types';
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useMultiEdit } from '../../../context/useMultiEdit';

const getTranslationKey = (key: string) => {
  return key.replaceAll(':', '_').replace(/^climbing_/, '');
};

export const getLabel = (key: string) =>
  // TODO TranslationId should never be dynamic, see https://github.com/zbycz/osmapp/pull/1229/files#r2276510504
  t(`climbing_badges.${getTranslationKey(key)}_label` as TranslationId);

const getDescription = (key: string) =>
  t(`climbing_badges.${getTranslationKey(key)}_description` as TranslationId);

const getValue = (value: string | undefined) => {
  if (value === 'yes') return t('yes');
  if (value === 'no') return t('no');
  return t('editdialog.custom_value');
};

type CustomValueInputProps = {
  k?: string;
};

const CustomValueInput = ({ k }: CustomValueInputProps) => {
  const { tags, mixed, setTag, removeTag } = useMultiEdit();
  const isMixed = Object.prototype.hasOwnProperty.call(mixed, k);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.trim() === '') removeTag(k);
    else setTag(k, value);
  };

  return (
    <Box
      sx={{
        mt: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {t('editdialog.custom_value')}:
      </Typography>
      <TextField
        size="small"
        value={isMixed ? '' : (tags[k] ?? '')}
        placeholder={isMixed ? t('editdialog.multiple_values') : undefined}
        onChange={onChange}
        sx={{
          minWidth: 160,
          '& input::placeholder': { fontStyle: 'italic' },
        }}
      />
    </Box>
  );
};

const EditButton = (props: { onClick: () => void }) => (
  <IconButton size="small" onClick={props.onClick}>
    <EditIcon fontSize="small" />
  </IconButton>
);

const CloseButton = (props: { onClick: () => void }) => (
  <IconButton size="small" onClick={props.onClick}>
    <CloseIcon fontSize="small" />
  </IconButton>
);

const ToggleTagButton = ({ k }: { k: string }) => {
  const { tags, mixed, setTag } = useMultiEdit();
  const isMixed = Object.prototype.hasOwnProperty.call(mixed, k);
  const value = isMixed ? undefined : tags[k];
  const onSwitch = (checked: boolean) => setTag(k, checked ? 'yes' : 'no');

  return (
    <Box
      title={
        isMixed && mixed[k]?.length
          ? t('editdialog.multiple_values_list', {
              values: mixed[k].join(', '),
            })
          : undefined
      }
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Switch
        size="small"
        checked={value === 'yes' || (value && value !== 'no')}
        onChange={(e) => onSwitch(e.target.checked)}
      />
      <Typography
        variant="caption"
        sx={{ fontStyle: isMixed ? 'italic' : undefined }}
      >
        {isMixed ? t('editdialog.multiple_values') : getValue(value)}
      </Typography>
    </Box>
  );
};

const TagLabel = ({ k }: { k: string }) => {
  const desc = getDescription(k);
  return (
    <>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 'bold',
        }}
      >
        {getLabel(k)}
      </Typography>
      {!!desc && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {desc}
        </Typography>
      )}
    </>
  );
};

type Props = {
  k: string;
  customValue: boolean;
};

export const EditorItem = ({ k, customValue }: Props) => {
  const [showCustom, setShowCustom] = useState(false);
  const { removeTag } = useMultiEdit();

  const onRemove = () => {
    removeTag(k);
  };

  const toggleCustom = () => setShowCustom((prev) => !prev);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            flex: 1,
            mr: 2,
          }}
        >
          <TagLabel k={k} />
          {customValue && showCustom && <CustomValueInput k={k} />}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <ToggleTagButton k={k} />

          {customValue && <EditButton onClick={toggleCustom} />}

          <CloseButton onClick={onRemove} />
        </Box>
      </Box>
    </Paper>
  );
};
