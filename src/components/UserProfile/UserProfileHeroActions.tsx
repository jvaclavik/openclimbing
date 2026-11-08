import React from 'react';
import { IconButton, ListItemIcon, MenuItem, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShareIcon from '@mui/icons-material/Share';
import { t } from '../../services/intl';
import { ClimbingTick } from '../../types';
import { profilePathForOsmDisplayName } from '../../services/my-ticks/profilePaths';
import {
  buildTicksCsv,
  buildTicksCsvFilename,
} from '../../services/my-ticks/exportTicksCsv';
import { useSnackbar } from '../utils/SnackbarContext';
import { useMoreMenu } from '../FeaturePanel/Climbing/useMoreMenu';

const OSM_USER_BASE = 'https://www.openstreetmap.org/user';

const downloadTicksCsv = (rawTicks: ClimbingTick[], displayName: string) => {
  const csv = buildTicksCsv(rawTicks);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  try {
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = buildTicksCsvFilename(displayName);
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
};

const useShareProfile = (displayName: string) => {
  const { showToast } = useSnackbar();
  return async () => {
    const url = `${window.location.origin}${profilePathForOsmDisplayName(
      displayName,
    )}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, url });
        return;
      } catch {
        // dismissed or unsupported payload – fall back to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('user_profile.profile_link_copied'), 'success');
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
    }
  };
};

export const UserProfileHeroActions = ({
  displayName,
  rawTicks,
}: {
  displayName: string;
  rawTicks: ClimbingTick[];
}) => {
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();
  const shareProfile = useShareProfile(displayName);

  return (
    <>
      <Tooltip title={t('user_profile.share_profile')}>
        <IconButton
          color="secondary"
          onClick={shareProfile}
          aria-label={t('user_profile.share_profile')}
        >
          <ShareIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('user_profile.more_actions')}>
        <IconButton
          color="secondary"
          onClick={handleClickMore}
          aria-label={t('user_profile.more_actions')}
        >
          <MoreHorizIcon />
        </IconButton>
      </Tooltip>
      <MoreMenu>
        <MenuItem
          disabled={rawTicks.length === 0}
          onClick={(e) => {
            downloadTicksCsv(rawTicks, displayName);
            handleCloseMore(e);
          }}
        >
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          {t('user_profile.export_csv')}
        </MenuItem>
        <MenuItem
          component="a"
          href={`${OSM_USER_BASE}/${encodeURIComponent(displayName)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCloseMore}
        >
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          {t('user_profile.osm_profile')}
        </MenuItem>
      </MoreMenu>
    </>
  );
};
