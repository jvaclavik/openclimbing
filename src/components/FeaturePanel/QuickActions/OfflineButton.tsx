import React, { useEffect, useState } from 'react';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import OfflinePinIcon from '@mui/icons-material/OfflinePin';
import { t } from '../../../services/intl';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useSnackbar } from '../../utils/SnackbarContext';
import { getShortId } from '../../../services/helpers';
import {
  isFeatureCachedOffline,
  isOfflineCacheSupported,
} from '../../../services/offline/offlineCache';
import {
  deleteArea,
  downloadArea,
  DownloadProgress,
} from '../../../services/offline/downloadArea';
import { getOfflineArea } from '../../../services/offline/offlineAreasStore';
import { QuickActionButton } from './QuickActionButton';

const percent = (p: DownloadProgress) =>
  p.total ? Math.round((p.done / p.total) * 100) : 0;

export const OfflineButton = () => {
  const { feature } = useFeatureContext();
  const { showToast } = useSnackbar();
  // `ownEntry`: downloaded on its own (has an /offline index entry).
  // `viaParent`: cached only because a parent area was downloaded.
  const [ownEntry, setOwnEntry] = useState(false);
  const [viaParent, setViaParent] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  // Render nothing until mounted: offline support is a browser-only capability
  // (`caches`/`serviceWorker`), so the server always renders null. Gating on
  // `mounted` keeps the first client render identical and avoids a hydration
  // mismatch with whatever button follows in QuickActions.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shortId = feature.osmMeta ? getShortId(feature.osmMeta) : undefined;

  useEffect(() => {
    setOwnEntry(shortId ? !!getOfflineArea(shortId) : false);
    let alive = true;
    if (feature.osmMeta) {
      isFeatureCachedOffline(feature.osmMeta).then((cached) => {
        if (alive) setViaParent(cached);
      });
    }
    return () => {
      alive = false;
    };
  }, [shortId, feature.osmMeta]);

  if (!mounted || !isOfflineCacheSupported()) return null;

  const downloading = progress !== null && progress.phase !== 'done';
  const availableOffline = ownEntry || viaParent;

  const handleClick = async () => {
    if (downloading) return;
    try {
      await downloadArea(feature, setProgress);
      setOwnEntry(true);
      showToast(t('offline.downloaded'), 'success');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Offline download failed:', e);
      showToast(t('offline.download_error'), 'error');
    } finally {
      setProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!shortId) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('offline.confirm_delete'))) return;
    await deleteArea(shortId);
    setOwnEntry(false);
    setViaParent(false);
  };

  if (downloading) {
    const label =
      progress?.phase === 'resolving'
        ? t('offline.updating')
        : t('offline.downloading', { percent: percent(progress!) });
    return <QuickActionButton icon={OfflinePinIcon} label={label} loading />;
  }

  if (availableOffline) {
    // Sectors saved as part of a parent area are managed at the area level —
    // show a read-only status. A directly-downloaded feature is clickable and
    // asks for confirmation to delete it.
    return (
      <QuickActionButton
        icon={OfflinePinIcon}
        label={t('offline.downloaded')}
        onClick={ownEntry ? handleDelete : undefined}
      />
    );
  }

  return (
    <QuickActionButton
      icon={DownloadForOfflineIcon}
      label={t('offline.download_button')}
      onClick={handleClick}
    />
  );
};
