import React, { useState } from 'react';
import { Button, Menu, MenuItem, Stack, Typography } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { t } from '../../services/intl';
import { ClimbingTick } from '../../types';
import { TickSelection } from './useTickSelection';
import { BulkDeleteTicksDialog } from './BulkDeleteTicksDialog';
import { BulkEditTicksDialog } from './BulkEditTicksDialog';

type Props = {
  selection: TickSelection;
  /** Selected ticks that are currently visible (respecting URL filter). */
  selectedTicks: ClimbingTick[];
};

const ActionsMenu = ({
  count,
  onEdit,
  onDelete,
}: {
  count: number;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const close = () => setAnchorEl(null);

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        disabled={count === 0}
        endIcon={<ArrowDropDownIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="menu"
      >
        {t('my_ticks.select.actions')}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            close();
            onEdit();
          }}
          sx={{ gap: 1 }}
        >
          <EditIcon fontSize="small" />
          {t('my_ticks.select.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            onDelete();
          }}
          sx={{ gap: 1, color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" />
          {t('my_ticks.select.delete')}
        </MenuItem>
      </Menu>
    </>
  );
};

/** Right side of the "Ticks" heading: "Select" toggle + bulk actions. */
export const TicksBulkToolbar = ({ selection, selectedTicks }: Props) => {
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);
  const count = selectedTicks.length;

  if (!selection.active) {
    return (
      <Button
        size="small"
        color="secondary"
        onClick={selection.start}
        sx={{ minWidth: 0 }}
      >
        {t('my_ticks.select.start')}
      </Button>
    );
  }

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
        >
          {t('my_ticks.select.selected_count', { count: String(count) })}
        </Typography>
        <ActionsMenu
          count={count}
          onEdit={() => setDialog('edit')}
          onDelete={() => setDialog('delete')}
        />
        <Button
          size="small"
          color="secondary"
          onClick={selection.stop}
          sx={{ minWidth: 0 }}
        >
          {t('my_ticks.select.cancel')}
        </Button>
      </Stack>

      {dialog === 'edit' ? (
        <BulkEditTicksDialog
          ticks={selectedTicks}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
        />
      ) : null}
      <BulkDeleteTicksDialog
        open={dialog === 'delete'}
        tickIds={selectedTicks.map((tick) => tick.id)}
        onClose={() => setDialog(null)}
        onDeleted={() => {
          setDialog(null);
          selection.stop();
        }}
      />
    </>
  );
};
