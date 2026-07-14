import React, { useCallback, useEffect, useState } from 'react';
import Router from 'next/router';
import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { intl, t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import {
  listOfflineAreas,
  OfflineArea,
} from '../../services/offline/offlineAreasStore';
import { deleteArea } from '../../services/offline/downloadArea';
import {
  countCachedUrls,
  measureCachedBytes,
} from '../../services/offline/offlineCache';

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${Math.round(bytes / 1024)} kB`;
};

export const OfflineAreasPanel = () => {
  const [areas, setAreas] = useState<OfflineArea[]>([]);
  // Sizes + cached-file counts measured live from the cache (keyed by shortId).
  // The count diagnoses whether the data is actually on disk.
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [cached, setCached] = useState<Record<string, number>>({});

  const refresh = useCallback(() => {
    const list = listOfflineAreas();
    setAreas(list);
    Promise.all(
      list.map(
        async (a) =>
          [
            a.shortId,
            await measureCachedBytes(a.urls),
            await countCachedUrls(a.urls),
          ] as const,
      ),
    ).then((entries) => {
      setSizes(Object.fromEntries(entries.map(([id, bytes]) => [id, bytes])));
      setCached(Object.fromEntries(entries.map(([id, , n]) => [id, n])));
    });
  }, []);

  useEffect(refresh, [refresh]);

  const handleClose = () => Router.push('/');

  const handleDelete = async (shortId: string) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('offline.confirm_delete'))) return;
    await deleteArea(shortId);
    refresh();
  };

  const handleOpen = (area: OfflineArea) =>
    Router.push(`/${area.osmType}/${area.osmId}`, undefined, {
      locale: intl.lang,
    });

  return (
    <MobilePageDrawer className="offline-areas-drawer">
      <PanelContent>
        <PanelScrollbars>
          <PanelSidePadding>
            <ClosePanelButton right onClick={handleClose} />
            <h1>{t('offline.page_title')}</h1>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('offline.page_intro')}
            </Typography>
            {areas.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {t('offline.storage_used', {
                  used: formatBytes(
                    Object.values(sizes).reduce((a, b) => a + b, 0),
                  ),
                })}
              </Typography>
            )}

            {areas.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 4, textAlign: 'center' }}
              >
                <CloudOffIcon
                  fontSize="large"
                  sx={{ display: 'block', mx: 'auto', mb: 1, opacity: 0.5 }}
                />
                {t('offline.empty')}
              </Typography>
            ) : (
              <List>
                {areas.map((area) => (
                  <ListItem
                    key={area.shortId}
                    disableGutters
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label={t('offline.delete')}
                        onClick={() => handleDelete(area.shortId)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton onClick={() => handleOpen(area)}>
                      <ListItemText
                        primary={area.name}
                        secondary={`${t('offline.features_count', {
                          count: area.featureCount,
                        })} · ${t('offline.photos_count', {
                          count: area.photoCount,
                        })} · ${formatBytes(sizes[area.shortId] ?? area.bytes)} · ${
                          cached[area.shortId] ?? '?'
                        }/${area.urls.length} v úložišti`}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </PanelSidePadding>
        </PanelScrollbars>
      </PanelContent>
    </MobilePageDrawer>
  );
};
