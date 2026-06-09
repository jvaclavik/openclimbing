import React, { useState } from 'react';
import { CircularProgress, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import { useSnackbar } from '../../utils/SnackbarContext';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useMoreMenu } from './useMoreMenu';
import { ClimbingTick } from '../../../types';
import { useTicksContext } from '../../utils/TicksContext';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { ShareTickDialog } from '../../MyTicksPanel/ShareTickDialog';
import { t } from '../../../services/intl';

type DeleteTickMenuItemProps = {
  tick: ClimbingTick;
  closeMenu: (e: React.MouseEvent) => void;
};

const DeleteTickMenuItem = ({ tick, closeMenu }: DeleteTickMenuItemProps) => {
  const { showToast } = useSnackbar();
  const { deleteTick } = useTicksContext();
  const [loading, setLoading] = useState(false);

  const onClick = async (event: React.MouseEvent) => {
    event.stopPropagation();

    setLoading(true);
    try {
      await deleteTick(tick.id);
      showToast('Tick was deleted', 'success');
    } catch (e) {
      showToast(`Error: ${e}`, 'error');
    } finally {
      setLoading(false);
      closeMenu(event);
    }
  };

  return (
    <MenuItem onClick={onClick} disableRipple>
      <DeleteIcon />
      Delete tick &nbsp;
      {loading && <CircularProgress size={24} />}
    </MenuItem>
  );
};

type Props = {
  tick: ClimbingTick;
  /** When provided, enables the "Share this ascent" menu item with full route metadata. */
  fetchedTick?: FetchedClimbingTick;
};

export const TickMoreButton = ({ tick, fetchedTick }: Props) => {
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();
  const { setEditedTickId } = useTicksContext();
  const { osmUser } = useOsmAuthContext();
  const [shareOpen, setShareOpen] = useState(false);

  const canShare = Boolean(fetchedTick && osmUser);

  return (
    <>
      <IconButton color="secondary" onClick={handleClickMore}>
        <MoreHorizIcon color="secondary" />
      </IconButton>

      <MoreMenu>
        <MenuItem
          onClick={(e) => {
            setEditedTickId(tick.id);
            handleCloseMore(e);
          }}
          disableRipple
        >
          <EditIcon />
          Edit tick
        </MenuItem>
        {canShare ? (
          <MenuItem
            onClick={(e) => {
              setShareOpen(true);
              handleCloseMore(e);
            }}
            disableRipple
          >
            <ShareIcon />
            {t('my_ticks.share.menu_tick')}
          </MenuItem>
        ) : null}
        <DeleteTickMenuItem tick={tick} closeMenu={handleCloseMore} />
      </MoreMenu>

      {shareOpen && fetchedTick && osmUser ? (
        <ShareTickDialog
          open
          mode="tick"
          tick={fetchedTick}
          displayName={osmUser}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );
};
