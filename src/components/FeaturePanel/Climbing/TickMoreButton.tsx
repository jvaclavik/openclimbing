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
import { synthesizeFetchedTickForShare } from '../../../services/my-ticks/synthesizeFetchedTickForShare';
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
      showToast(t('tick.deleted_toast'), 'success');
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
    } finally {
      setLoading(false);
      closeMenu(event);
    }
  };

  return (
    <MenuItem onClick={onClick} disableRipple>
      <DeleteIcon />
      {t('tick.delete_button')} &nbsp;
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

  const effectiveFetchedTick =
    fetchedTick ?? synthesizeFetchedTickForShare(tick);
  const canShare = Boolean(effectiveFetchedTick && osmUser);

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
          {t('tick.edit_button')}
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

      {shareOpen && effectiveFetchedTick && osmUser ? (
        <ShareTickDialog
          open
          mode="tick"
          tick={effectiveFetchedTick}
          displayName={osmUser}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );
};
