import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Collapse,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Router from 'next/router';
import { t } from '../../../services/intl';
import { useMyListsContext } from '../../utils/MyListsContext';
import { usePersistedState } from '../../utils/usePersistedState';
import { UserList } from '../../../services/my-lists/myListsTypes';
import { CreateListDialog } from '../../MyLists/CreateListDialog';
import { EditListDialog } from '../../MyLists/EditListDialog';
import { ListAvatar } from '../../MyLists/ListAvatar';

type RowProps = {
  list: UserList;
  visible: boolean;
  onToggleVisible: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const ListRow = ({
  list,
  visible,
  onToggleVisible,
  onOpen,
  onEdit,
  onDelete,
}: RowProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenKebab = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };
  const handleCloseKebab = () => setAnchorEl(null);

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      sx={{
        px: 1,
        py: 0.25,
        '&:hover': { backgroundColor: 'action.hover' },
      }}
    >
      <Checkbox
        size="small"
        checked={visible}
        onChange={onToggleVisible}
        onClick={(e) => e.stopPropagation()}
        inputProps={{ 'aria-label': t('mylists.show_on_map') }}
      />
      <Box
        flex={1}
        display="flex"
        alignItems="center"
        gap={1}
        sx={{ cursor: 'pointer', py: 0.5 }}
        onClick={onOpen}
      >
        <ListAvatar emoji={list.emoji} color={list.color} size="sm" />
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {list.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('mylists.item_count', { count: String(list.items.length) })}
          </Typography>
        </Box>
      </Box>
      <IconButton size="small" onClick={handleOpenKebab}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseKebab}
        onClick={handleCloseKebab}
      >
        <MenuItem onClick={onEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('mylists.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={onDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('mylists.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  );
};

type Props = {
  closeMenu: () => void;
};

export const MyListsSection = ({ closeMenu }: Props) => {
  const { lists, visibleListIds, toggleListVisibility, deleteList } =
    useMyListsContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<UserList | null>(null);
  const [expanded, setExpanded] = usePersistedState<boolean>(
    'myLists.menuExpanded',
    false,
  );

  const handleOpen = (list: UserList) => {
    closeMenu();
    Router.push(`/my-lists/${list.id}`);
  };

  const handleDelete = async (list: UserList) => {
    const ok = window.confirm(t('mylists.confirm_delete', { name: list.name }));
    if (!ok) return;
    await deleteList(list.id);
  };

  const count = lists?.length ?? 0;

  return (
    <Box mt={1} mb={1}>
      <ButtonBase
        onClick={() => setExpanded(!expanded)}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          gap: 0.5,
          px: 2,
          py: 0.5,
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        {expanded ? (
          <ExpandLessIcon fontSize="small" color="action" />
        ) : (
          <ExpandMoreIcon fontSize="small" color="action" />
        )}
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 0.5 }}
        >
          {t('mylists.title')}
          {count > 0 ? ` (${count})` : ''}
        </Typography>
      </ButtonBase>

      <Collapse in={expanded} unmountOnExit>
        {count === 0 ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 2, display: 'block' }}
          >
            {t('mylists.no_lists')}
          </Typography>
        ) : (
          (lists ?? []).map((list) => (
            <ListRow
              key={list.id}
              list={list}
              visible={visibleListIds.includes(list.id)}
              onToggleVisible={() => toggleListVisibility(list.id)}
              onOpen={() => handleOpen(list)}
              onEdit={() => setEditingList(list)}
              onDelete={() => handleDelete(list)}
            />
          ))
        )}
        <Box sx={{ px: 2, py: 1 }}>
          <Button
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => setCreateOpen(true)}
          >
            {t('mylists.create_new')}
          </Button>
        </Box>
      </Collapse>

      <CreateListDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <EditListDialog
        open={editingList !== null}
        list={editingList}
        onClose={() => setEditingList(null)}
      />
    </Box>
  );
};
