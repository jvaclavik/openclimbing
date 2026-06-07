import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { t } from '../../services/intl';
import { UserList } from '../../services/my-lists/myListsTypes';
import { DEFAULT_LIST_COLOR } from '../../services/my-lists/listColors';
import { useMyListsContext } from '../utils/MyListsContext';
import { ColorPicker } from './ColorPicker';
import { EmojiPresets, EmojiTextField } from './EmojiInput';

type Props = {
  open: boolean;
  list: UserList | null;
  onClose: () => void;
};

export const EditListDialog = ({ open, list, onClose }: Props) => {
  const { updateList } = useMyListsContext();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState(DEFAULT_LIST_COLOR);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && list) {
      setName(list.name);
      setEmoji(list.emoji);
      setColor(list.color || DEFAULT_LIST_COLOR);
    }
  }, [open, list]);

  const handleSave = async () => {
    if (!list) return;
    const trimmedName = name.trim();
    const trimmedEmoji = emoji.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      await updateList(list.id, {
        name: trimmedName,
        emoji: trimmedEmoji,
        color,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('mylists.edit')}</DialogTitle>
      <DialogContent dividers>
        <Stack direction="column" gap={2} mt={1}>
          <Stack direction="row" gap={1} alignItems="flex-start">
            <EmojiTextField value={emoji} onChange={setEmoji} />
            <TextField
              size="small"
              fullWidth
              autoFocus
              label={t('mylists.name_placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              slotProps={{ htmlInput: { style: { fontSize: 22 } } }}
            />
          </Stack>
          <EmojiPresets value={emoji} onChange={setEmoji} />
          <ColorPicker value={color} onChange={setColor} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('mylists.cancel')}
        </Button>
        <LoadingButton
          onClick={handleSave}
          variant="contained"
          loading={saving}
          disabled={!name.trim()}
        >
          {t('mylists.done')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
