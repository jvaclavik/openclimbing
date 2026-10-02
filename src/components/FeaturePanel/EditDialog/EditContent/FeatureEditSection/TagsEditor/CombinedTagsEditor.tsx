import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, IconButton, Stack } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { t } from '../../../../../../services/intl';
import { useMultiEdit } from '../../../context/useMultiEdit';
import { FastInput } from './helpers';

const useDraftKey = (currentKey: string) => {
  const [draft, setDraft] = useState(currentKey);
  useEffect(() => {
    setDraft(currentKey);
  }, [currentKey]);
  return { draft, setDraft };
};

const TagKeyInput = ({ tagKey }: { tagKey: string }) => {
  const { renameTag } = useMultiEdit();
  const { draft, setDraft } = useDraftKey(tagKey);

  return (
    <FastInput
      value={draft}
      autoCapitalize="none"
      maxLength={255}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.trim();
        if (!next || next === tagKey) {
          setDraft(tagKey);
          return;
        }
        renameTag(tagKey, next);
      }}
    />
  );
};

const TagValueInput = ({ tagKey }: { tagKey: string }) => {
  const { tags, mixed, setTag, removeTag } = useMultiEdit();
  const mixedValues = Object.prototype.hasOwnProperty.call(mixed, tagKey)
    ? mixed[tagKey]
    : undefined;
  const isMixed = mixedValues !== undefined;

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <FastInput
        value={isMixed ? '' : (tags[tagKey] ?? '')}
        placeholder={isMixed ? t('editdialog.multiple_values') : undefined}
        title={
          isMixed && mixedValues.length
            ? t('editdialog.multiple_values_list', {
                values: mixedValues.join(', '),
              })
            : undefined
        }
        autoCapitalize="none"
        maxLength={255}
        onChange={(event) => setTag(tagKey, event.target.value)}
      />
      <IconButton
        size="small"
        aria-label={t('editdialog.remove')}
        onClick={() => removeTag(tagKey)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};

const NewTagRow = ({
  onCommit,
}: {
  onCommit: (key: string, value: string) => void;
}) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const commit = () => {
    const nextKey = key.trim();
    if (!nextKey) return;
    onCommit(nextKey, value);
  };

  return (
    <tr
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && event.currentTarget.contains(next)) return;
        commit();
      }}
    >
      <th>
        <FastInput
          value={key}
          placeholder={t('editdialog.add_tag')}
          autoCapitalize="none"
          maxLength={255}
          onChange={(event) => setKey(event.target.value)}
        />
      </th>
      <td>
        <FastInput
          value={value}
          autoCapitalize="none"
          maxLength={255}
          onChange={(event) => setValue(event.target.value)}
        />
      </td>
    </tr>
  );
};

export const CombinedTagsEditor = () => {
  const { keys, setTag } = useMultiEdit();
  const [adding, setAdding] = useState(false);

  return (
    <>
      {keys.map((tagKey) => (
        <tr key={tagKey}>
          <th>
            <TagKeyInput tagKey={tagKey} />
          </th>
          <td>
            <TagValueInput tagKey={tagKey} />
          </td>
        </tr>
      ))}
      {adding ? (
        <NewTagRow
          onCommit={(key, value) => {
            setTag(key, value);
            setAdding(false);
          }}
        />
      ) : (
        <tr>
          <td colSpan={2}>
            <Button
              variant="text"
              color="primary"
              disableElevation
              onClick={() => setAdding(true)}
              startIcon={<AddIcon />}
            >
              {t('editdialog.add_tag')}
            </Button>
          </td>
        </tr>
      )}
    </>
  );
};
