import React, { useEffect, useState } from 'react';
import {
  Box,
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
import { useMyListsContext } from '../utils/MyListsContext';
import { pickNextListColor } from '../../services/my-lists/listColors';
import { ColorPicker } from './ColorPicker';
import { EmojiPresets, EmojiTextField } from './EmojiInput';
import { ListPresets } from './ListPresets';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Optional callback fired with the new list id after a successful create. */
  onCreated?: (id: number) => void;
};

export const CreateListDialog = ({ open, onClose, onCreated }: Props) => {
  const { lists, createList } = useMyListsContext();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setEmoji('');
      setColor(pickNextListColor((lists ?? []).map((l) => l.color)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const createAndClose = async (n: string, e: string) => {
    if (!n) return;
    setSaving(true);
    try {
      const id = await createList(n, e, color);
      onCreated?.(id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => createAndClose(name.trim(), emoji.trim());

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('mylists.create_new')}</DialogTitle>
      <DialogContent dividers>
        <ListPresets
          existingNames={(lists ?? []).map((l) => l.name)}
          onSelect={createAndClose}
          disabled={saving}
        />
        <Box mt={3}>
          <Stack direction="column" gap={2}>
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
                  if (e.key === 'Enter') handleCreate();
                }}
                slotProps={{ htmlInput: { style: { fontSize: 22 } } }}
              />
            </Stack>
            <EmojiPresets value={emoji} onChange={setEmoji} />
            <ColorPicker value={color} onChange={setColor} />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('mylists.cancel')}
        </Button>
        <LoadingButton
          onClick={handleCreate}
          variant="contained"
          loading={saving}
          disabled={!name.trim()}
        >
          {t('mylists.create')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
