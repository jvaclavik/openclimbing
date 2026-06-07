import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LoadingButton from '@mui/lab/LoadingButton';
import { t } from '../../services/intl';
import { useMyListsContext } from '../utils/MyListsContext';
import { UserList, UserListItem } from '../../services/my-lists/myListsTypes';
import { CreateListDialog } from './CreateListDialog';
import { ListAvatar } from './ListAvatar';
import { ListPresets } from './ListPresets';

type ListRowProps = {
  list: UserList;
  checked: boolean;
  onToggle: () => void;
};

const ListPickerRow = ({ list, checked, onToggle }: ListRowProps) => (
  <ListItem disablePadding>
    <ListItemButton onClick={onToggle}>
      <ListItemIcon sx={{ minWidth: 36 }}>
        <ListAvatar emoji={list.emoji} color={list.color} size="sm" />
      </ListItemIcon>
      <ListItemText
        primary={list.name}
        secondary={t('mylists.item_count', {
          count: String(list.items.length),
        })}
      />
      <Checkbox edge="end" checked={checked} tabIndex={-1} disableRipple />
    </ListItemButton>
  </ListItem>
);

type Props = {
  open: boolean;
  onClose: () => void;
  item: Omit<UserListItem, 'addedAt'> | null;
};

type BodyProps = {
  lists: UserList[] | null;
  selected: Set<number>;
  toggle: (id: number) => void;
  onOpenCreate: () => void;
  onCreateFromPreset: (name: string, emoji: string) => Promise<void>;
  saving: boolean;
};

const PickerBody = ({
  lists,
  selected,
  toggle,
  onOpenCreate,
  onCreateFromPreset,
  saving,
}: BodyProps) => (
  <DialogContent dividers>
    {(lists?.length ?? 0) === 0 && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t('mylists.no_lists')}
      </Typography>
    )}

    <List dense disablePadding>
      {(lists ?? []).map((list) => (
        <ListPickerRow
          key={list.id}
          list={list}
          checked={selected.has(list.id)}
          onToggle={() => toggle(list.id)}
        />
      ))}
    </List>

    <Divider sx={{ my: 1 }} />

    <ListPresets
      existingNames={(lists ?? []).map((l) => l.name)}
      onSelect={onCreateFromPreset}
      disabled={saving}
    />

    <Box>
      <Button startIcon={<AddIcon />} onClick={onOpenCreate} size="small">
        {t('mylists.create_new')}
      </Button>
    </Box>
  </DialogContent>
);

const computeDiff = (
  lists: UserList[] | null,
  initial: Set<number>,
  current: Set<number>,
) => {
  const toAdd: number[] = [];
  const toRemove: number[] = [];
  for (const list of lists ?? []) {
    const wasIn = initial.has(list.id);
    const isIn = current.has(list.id);
    if (!wasIn && isIn) toAdd.push(list.id);
    if (wasIn && !isIn) toRemove.push(list.id);
  }
  return { toAdd, toRemove };
};

export const ListPickerDialog = ({ open, onClose, item }: Props) => {
  const { lists, listsContaining, addToList, removeFromList, createList } =
    useMyListsContext();

  const [initialSelected, setInitialSelected] = useState<Set<number>>(
    new Set(),
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state when the dialog opens. We intentionally do NOT depend on
  // listsContaining or lists — they change identity on every refetch (e.g. after
  // creating a list from a preset), and re-running this effect would wipe the
  // user's freshly toggled / created selections.
  useEffect(() => {
    if (!open) return;
    const fresh = new Set(
      item ? listsContaining(item.shortId).map((l) => l.id) : [],
    );
    setInitialSelected(fresh);
    setSelected(new Set(fresh));
    setCreateOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateFromPreset = async (name: string, emoji: string) => {
    if (!name) return;
    setSaving(true);
    try {
      const id = await createList(name, emoji);
      setSelected((prev) => new Set(prev).add(id));
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async () => {
    if (!item) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const { toAdd, toRemove } = computeDiff(lists, initialSelected, selected);
      for (const listId of toAdd) await addToList(listId, item);
      for (const listId of toRemove) await removeFromList(listId, item.shortId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>{t('mylists.add_to_list')}</DialogTitle>
        <PickerBody
          lists={lists}
          selected={selected}
          toggle={toggle}
          onOpenCreate={() => setCreateOpen(true)}
          onCreateFromPreset={handleCreateFromPreset}
          saving={saving}
        />
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            {t('mylists.cancel')}
          </Button>
          <LoadingButton
            onClick={handleDone}
            variant="contained"
            loading={saving}
          >
            {t('mylists.done')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <CreateListDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => setSelected((prev) => new Set(prev).add(id))}
      />
    </>
  );
};
