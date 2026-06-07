import React, { useEffect, useMemo, useRef, useState } from 'react';
import Router, { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LoadingButton from '@mui/lab/LoadingButton';
import { t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { ClientOnly } from '../helpers';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { useMyListsContext } from '../utils/MyListsContext';
import { useOsmAuthContext } from '../utils/OsmAuthContext';
import { getApiId, getUrlOsmId } from '../../services/helpers';
import { UserList, UserListItem } from '../../services/my-lists/myListsTypes';
import { EditListDialog } from './EditListDialog';
import { ListAvatar } from './ListAvatar';

const useExclusiveListVisibility = (listId: number | null) => {
  const { visibleListIds, setVisibleListIds } = useMyListsContext();
  const prevRef = useRef<number[] | null>(null);

  useEffect(() => {
    if (listId == null) {
      return;
    }
    prevRef.current = visibleListIds;
    setVisibleListIds([listId]);
    return () => {
      if (prevRef.current) {
        setVisibleListIds(prevRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);
};

const featureLinkForShortId = (shortId: string) => {
  try {
    const apiId = getApiId(shortId);
    if (!apiId.type) return '/';
    return `/${getUrlOsmId(apiId)}`;
  } catch {
    return '/';
  }
};

type HeaderProps = {
  list: UserList;
  onRename: () => void;
  onDelete: () => void;
  deleting: boolean;
};

const ListHeader = ({ list, onRename, onDelete, deleting }: HeaderProps) => (
  <Stack direction="row" alignItems="center" gap={1.5} mt={4} mb={2}>
    <ListAvatar emoji={list.emoji} color={list.color} size="lg" />
    <Box flex={1} minWidth={0}>
      <Typography variant="h5" noWrap>
        {list.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('mylists.item_count', { count: String(list.items.length) })}
      </Typography>
    </Box>
    <Button
      size="small"
      startIcon={<EditIcon fontSize="small" />}
      onClick={onRename}
      disabled={deleting}
    >
      {t('mylists.edit')}
    </Button>
    <LoadingButton
      size="small"
      color="error"
      startIcon={<DeleteIcon fontSize="small" />}
      onClick={onDelete}
      loading={deleting}
    >
      {t('mylists.delete')}
    </LoadingButton>
  </Stack>
);

type ItemRowProps = {
  item: UserListItem;
  onRemove: () => void;
};

const ItemRow = ({ item, onRemove }: ItemRowProps) => (
  <ListItem key={item.shortId} disablePadding>
    <ListItemButton component={Link} href={featureLinkForShortId(item.shortId)}>
      <ListItemText
        primary={item.label || item.shortId}
        secondary={item.poiType}
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          size="small"
          aria-label={t('mylists.remove_item')}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItemButton>
  </ListItem>
);

type ListBodyProps = {
  list: UserList;
  onRemoveItem: (shortId: string) => void;
};

const ListBody = ({ list, onRemoveItem }: ListBodyProps) => {
  if (list.items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('mylists.empty')}
      </Typography>
    );
  }
  return (
    <List dense disablePadding>
      {list.items.map((item) => (
        <ItemRow
          key={item.shortId}
          item={item}
          onRemove={() => onRemoveItem(item.shortId)}
        />
      ))}
    </List>
  );
};

export const MyListDetailPanel = () => {
  const router = useRouter();
  const { loggedIn } = useOsmAuthContext();
  const { lists, removeFromList, deleteList } = useMyListsContext();

  const id = useMemo(() => {
    const raw = Array.isArray(router.query.id)
      ? router.query.id[0]
      : router.query.id;
    const n = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(n) ? n : null;
  }, [router.query.id]);

  const list = useMemo(
    () =>
      id == null ? null : ((lists ?? []).find((l) => l.id === id) ?? null),
    [id, lists],
  );

  useExclusiveListVisibility(list ? list.id : null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => Router.push('/');

  const handleDelete = async () => {
    if (!list) return;
    const ok = window.confirm(t('mylists.confirm_delete', { name: list.name }));
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteList(list.id);
      Router.push('/');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ClientOnly>
      <MobilePageDrawer className="my-lists-drawer">
        <PanelContent>
          <PanelScrollbars>
            <ClosePanelButton right onClick={handleClose} />
            <PanelSidePadding>
              {!loggedIn ? (
                <Typography variant="body1" mt={4}>
                  {t('mylists.login_required')}
                </Typography>
              ) : lists === null ? null : !list ? (
                <Typography variant="body1" mt={4}>
                  {t('mylists.not_found')}
                </Typography>
              ) : (
                <>
                  <ListHeader
                    list={list}
                    onRename={() => setEditOpen(true)}
                    onDelete={handleDelete}
                    deleting={deleting}
                  />
                  <ListBody
                    list={list}
                    onRemoveItem={(shortId) => removeFromList(list.id, shortId)}
                  />
                  <EditListDialog
                    open={editOpen}
                    list={list}
                    onClose={() => setEditOpen(false)}
                  />
                </>
              )}
            </PanelSidePadding>
          </PanelScrollbars>
        </PanelContent>
      </MobilePageDrawer>
    </ClientOnly>
  );
};
