import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { t } from '../../services/intl';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import type { TopoMetaResponse } from '../../../pages/api/topo-meta';
import { useMobileMode } from '../helpers';

const TILE_HEIGHT = 180;
/** Placeholder aspect ratio used before an image has loaded. */
const PLACEHOLDER_ASPECT_RATIO = '16 / 9';

type ImageTileSpec = {
  imageId: string;
  photoIndex: number;
  routeFilter: string[];
  caption: string;
  key: string;
  /** Ticks contributing to this tile (for caption count). */
  ticks: FetchedClimbingTick[];
};

const cragShortIdFromTick = (tick: FetchedClimbingTick): string | null => {
  if (!tick.cragOsmType || tick.cragOsmId == null) return null;
  return `${tick.cragOsmType.charAt(0)}${tick.cragOsmId}`;
};

const sanitizeFilename = (input: string): string =>
  input.replace(/[^a-zA-Z0-9-_]+/g, '_').replace(/^_+|_+$/g, '') || 'topo';

const buildOgImageUrl = (
  imageId: string,
  photoIndex: number,
  routeFilter: string[],
  refreshNonce = 0,
): string => {
  const params = new URLSearchParams({ id: imageId, raw: '1' });
  if (photoIndex > 0) {
    params.set('photoIndex', String(photoIndex));
  }
  if (routeFilter.length > 0) {
    params.set('routes', routeFilter.join(','));
  }
  // Bust browser/CDN cache and tell the API to skip its server-side OSM cache,
  // so freshly drawn paths show up instead of a stale render.
  if (refreshNonce > 0) {
    params.set('fresh', '1');
    params.set('v', String(refreshNonce));
  }
  return `/api/og-image?${params.toString()}`;
};

const fetchTopoMeta = async (
  cragShortId: string,
  refreshNonce = 0,
): Promise<TopoMetaResponse | null> => {
  try {
    const params = new URLSearchParams({ id: cragShortId });
    if (refreshNonce > 0) {
      params.set('fresh', '1');
      params.set('v', String(refreshNonce));
    }
    const res = await fetch(`/api/topo-meta?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as TopoMetaResponse;
  } catch {
    return null;
  }
};

const useTopoMeta = (
  cragShortIds: string[],
  refreshNonce = 0,
): { meta: Map<string, TopoMetaResponse>; loading: boolean } => {
  const key = `${cragShortIds.slice().sort().join(',')}|${refreshNonce}`;
  const [meta, setMeta] = useState<Map<string, TopoMetaResponse>>(new Map());
  const [loading, setLoading] = useState(cragShortIds.length > 0);

  useEffect(() => {
    if (cragShortIds.length === 0) {
      setMeta(new Map());
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const results = await Promise.all(
        cragShortIds.map(
          async (id) => [id, await fetchTopoMeta(id, refreshNonce)] as const,
        ),
      );
      if (cancelled) return;
      const out = new Map<string, TopoMetaResponse>();
      for (const [id, data] of results) {
        if (data) out.set(id, data);
      }
      setMeta(out);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { meta, loading };
};

type CragGroup = {
  cragShortId: string | null;
  ticks: FetchedClimbingTick[];
};

const groupTicksByCrag = (ticks: FetchedClimbingTick[]): CragGroup[] => {
  const order: string[] = [];
  const map = new Map<string, CragGroup>();
  const orphans: FetchedClimbingTick[] = [];
  for (const tick of ticks) {
    if (!tick.tick.shortId) continue;
    const cragId = cragShortIdFromTick(tick);
    if (!cragId) {
      orphans.push(tick);
      continue;
    }
    if (!map.has(cragId)) {
      order.push(cragId);
      map.set(cragId, { cragShortId: cragId, ticks: [] });
    }
    map.get(cragId)!.ticks.push(tick);
  }
  const groups = order.map((id) => map.get(id)!);
  if (orphans.length > 0) {
    groups.push({ cragShortId: null, ticks: orphans });
  }
  return groups;
};

const planTilesForCragGroup = (
  group: CragGroup,
  meta: TopoMetaResponse | undefined,
): ImageTileSpec[] => {
  const tickShortIds = group.ticks
    .map((tick) => tick.tick.shortId!)
    .filter(Boolean);
  const tickByShortId = new Map(
    group.ticks.map((tick) => [tick.tick.shortId!, tick] as const),
  );

  // Orphan group or no metadata available — render single-route tiles per tick.
  if (!group.cragShortId || !meta) {
    return group.ticks.map((tick) => ({
      imageId: tick.tick.shortId!,
      photoIndex: 0,
      routeFilter: [tick.tick.shortId!],
      caption: tick.name,
      key: `solo-${tick.tick.shortId}`,
      ticks: [tick],
    }));
  }

  const allowedSet = new Set(tickShortIds);
  const tiles: ImageTileSpec[] = [];
  const cragRepresentative = group.ticks[0];

  // Greedy assignment: when the same climbed route appears on multiple topo
  // photos, the photo carrying the most of *this session's* climbed routes
  // claims it (ties broken by original photo order). Subsequent photos only
  // see routes not yet claimed — so each route ends up drawn on exactly one
  // tile and the user doesn't see duplicate tiles for the same route.
  const candidates = meta.photos
    .map((photo, photoOrder) => ({
      photo,
      photoOrder,
      allowedHere: photo.memberShortIds.filter((id) => allowedSet.has(id)),
    }))
    .filter((c) => c.allowedHere.length > 0)
    .sort((a, b) => {
      if (b.allowedHere.length !== a.allowedHere.length) {
        return b.allowedHere.length - a.allowedHere.length;
      }
      return a.photoOrder - b.photoOrder;
    });

  const claimed = new Set<string>();
  for (const { photo } of candidates) {
    const uniqueIds = photo.memberShortIds.filter(
      (id) => allowedSet.has(id) && !claimed.has(id),
    );
    if (uniqueIds.length === 0) continue;
    uniqueIds.forEach((id) => claimed.add(id));
    const intersectionTicks = uniqueIds
      .map((id) => tickByShortId.get(id))
      .filter((tick): tick is FetchedClimbingTick => !!tick);
    const cragLabel = cragRepresentative.cragName ?? cragRepresentative.name;
    const caption =
      intersectionTicks.length === 1 ? intersectionTicks[0].name : cragLabel;
    tiles.push({
      imageId: group.cragShortId,
      photoIndex: photo.photoIndex,
      routeFilter: uniqueIds,
      caption,
      key: `crag-${group.cragShortId}-photo-${photo.photoIndex}`,
      ticks: intersectionTicks,
    });
  }

  // Any climbed route not drawn on a topo photo (no `…:path`) was never claimed
  // above. Without this it would silently vanish from the gallery even though
  // it has its own photo on the route detail. Add a per-route tile for each so
  // every climbed route shows a photo. (Also covers the case where no topo
  // photo contained any climbed route — then all routes fall here.)
  const leftoverTicks = group.ticks.filter(
    (tick) => !claimed.has(tick.tick.shortId!),
  );
  for (const tick of leftoverTicks) {
    tiles.push({
      imageId: tick.tick.shortId!,
      photoIndex: 0,
      routeFilter: [tick.tick.shortId!],
      caption: tick.name,
      key: `solo-${tick.tick.shortId}`,
      ticks: [tick],
    });
  }

  return tiles;
};

const planAllTiles = (
  ticks: FetchedClimbingTick[],
  meta: Map<string, TopoMetaResponse>,
): ImageTileSpec[] => {
  const groups = groupTicksByCrag(ticks);
  return groups.flatMap((group) =>
    planTilesForCragGroup(
      group,
      group.cragShortId ? meta.get(group.cragShortId) : undefined,
    ),
  );
};

type TileProps = {
  tile: ImageTileSpec;
  refreshNonce: number;
};

/**
 * On supporting browsers (mobile Safari/Chrome) opens the OS share sheet with
 * the file — user can choose "Save Image" / "Save to Photos" and the PNG goes
 * directly into the gallery instead of the Downloads folder. Falls back to a
 * regular download anchor on desktop and unsupported environments.
 */
const tryShareOrDownload = async (
  url: string,
  filename: string,
  title: string,
): Promise<void> => {
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type || 'image/png' });

    if (canShareFiles && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return;
    }

    // Fallback: programmatic anchor download into Downloads folder.
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return; // user cancelled share
    // Last resort: open in new tab, user can long-press / right-click to save.
    window.open(url, '_blank', 'noopener');
  }
};

const ImageTile = ({ tile, refreshNonce }: TileProps) => {
  const isMobileMode = useMobileMode();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (errored) return null;

  const url = buildOgImageUrl(
    tile.imageId,
    tile.photoIndex,
    tile.routeFilter,
    refreshNonce,
  );
  const filename = `${sanitizeFilename(tile.caption)}.png`;
  const isMulti = tile.ticks.length > 1;
  const countSuffix = isMulti
    ? ` · ${t('my_ticks.share.images_group_count', {
        count: String(tile.ticks.length),
      })}`
    : '';

  return (
    <Box
      sx={{ flex: '0 0 auto', display: 'inline-flex', flexDirection: 'column' }}
    >
      <Box
        sx={{
          position: 'relative',
          height: TILE_HEIGHT,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'action.hover',
          // Reserve a sane placeholder area while the image loads. Once the
          // image arrives its intrinsic width drives the tile width.
          ...(loaded ? {} : { aspectRatio: PLACEHOLDER_ASPECT_RATIO }),
        }}
      >
        {!loaded ? (
          <Skeleton
            variant="rectangular"
            sx={{ position: 'absolute', inset: 0 }}
          />
        ) : null}
        <Box
          component="img"
          src={url}
          alt={tile.caption}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          sx={{
            display: 'block',
            height: '100%',
            width: 'auto',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 200ms',
          }}
        />
      </Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ pt: 0.5, width: '100%' }}
      >
        <Typography
          variant="caption"
          noWrap
          sx={{ flex: 1, minWidth: 0 }}
          title={`${tile.caption}${countSuffix}`}
        >
          {tile.caption}
          {countSuffix}
        </Typography>
        <Tooltip title={t('my_ticks.share.images_download')}>
          {isMobileMode ? (
            <IconButton
              size="small"
              onClick={() => tryShareOrDownload(url, filename, tile.caption)}
              aria-label={t('my_ticks.share.images_download')}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              component="a"
              href={url}
              download={filename}
              aria-label={t('my_ticks.share.images_download')}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          )}
        </Tooltip>
      </Stack>
    </Box>
  );
};

const LoadingTile = ({ tileKey }: { tileKey: string }) => (
  <Box
    key={tileKey}
    sx={{ flex: '0 0 auto', display: 'inline-flex', flexDirection: 'column' }}
  >
    <Skeleton
      variant="rectangular"
      sx={{
        height: TILE_HEIGHT,
        aspectRatio: PLACEHOLDER_ASPECT_RATIO,
        borderRadius: 1,
      }}
    />
    <Skeleton variant="text" sx={{ mt: 0.5, width: '60%' }} />
  </Box>
);

type Props = {
  ticks: FetchedClimbingTick[];
};

export const SessionRouteImagesGallery = ({ ticks }: Props) => {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const cragShortIds = useMemo(() => {
    const set = new Set<string>();
    for (const tick of ticks) {
      const id = cragShortIdFromTick(tick);
      if (id) set.add(id);
    }
    return [...set];
  }, [ticks]);

  const { meta, loading } = useTopoMeta(cragShortIds, refreshNonce);
  const tiles = useMemo(() => planAllTiles(ticks, meta), [ticks, meta]);

  if (!loading && tiles.length === 0) return null;

  return (
    <Box mb={2}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="overline" sx={{ flex: 1 }}>
          {t('my_ticks.share.images_label')}
        </Typography>
        <Tooltip title={t('my_ticks.share.images_refresh')}>
          <IconButton
            size="small"
            onClick={() => setRefreshNonce(Date.now())}
            aria-label={t('my_ticks.share.images_refresh')}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          overflowX: 'auto',
          pb: 1,
          scrollSnapType: 'x mandatory',
          '& > *': {
            scrollSnapAlign: 'start',
          },
        }}
      >
        {loading ? (
          <>
            <LoadingTile tileKey="loading-1" />
            <LoadingTile tileKey="loading-2" />
            <LoadingTile tileKey="loading-3" />
          </>
        ) : (
          tiles.map((tile) => (
            <ImageTile
              key={`${tile.key}-${refreshNonce}`}
              tile={tile}
              refreshNonce={refreshNonce}
            />
          ))
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {t('my_ticks.share.images_hint')}
      </Typography>
    </Box>
  );
};
