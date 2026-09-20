import { useEffect, useState } from 'react';
import { fetchJson } from '../../../../../services/fetch';
import { CLIMBING_TILES_HOST } from '../../../../../services/osm/consts';
import { getApiId, getShortId } from '../../../../../services/helpers';
import { Feature, LonLat } from '../../../../../services/types';
import { ClimbingNearbyRecord } from '../../../../../types';
import { isValidLonLat } from '../../../Climbing/utils/cragCenter';
import { useFeatureContext } from '../../../../utils/FeatureContext';
import { useCurrentItem, useEditContext } from '../../context/EditContext';
import { findInItems } from '../../context/utils';

const findCenterInFeatureTree = (
  feature: Feature | undefined,
  shortId: string,
): LonLat | undefined => {
  if (!feature) return undefined;
  const stack = [feature, ...(feature.memberFeatures ?? [])];
  while (stack.length) {
    const current = stack.shift();
    if (!current) continue;
    if (
      getShortId(current.osmMeta) === shortId &&
      isValidLonLat(current.center)
    ) {
      return current.center;
    }
    if (current.memberFeatures?.length) {
      stack.push(...current.memberFeatures);
    }
  }
  return undefined;
};

const useCurrentItemCenter = (): LonLat | undefined => {
  const current = useCurrentItem();
  const { items } = useEditContext();
  const { feature } = useFeatureContext() ?? { feature: undefined };

  if (isValidLonLat(current.nodeLonLat)) return current.nodeLonLat;
  if (isValidLonLat(current.relationClickedLonLat)) {
    return current.relationClickedLonLat;
  }

  const fromTree = findCenterInFeatureTree(feature, current.shortId);
  if (fromTree) return fromTree;

  const memberCenters = (current.members ?? [])
    .map((member) => findInItems(items, member.shortId)?.nodeLonLat)
    .filter(isValidLonLat);
  if (memberCenters.length) {
    const sum = memberCenters.reduce(
      (acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat] as LonLat,
      [0, 0] as LonLat,
    );
    return [sum[0] / memberCenters.length, sum[1] / memberCenters.length];
  }

  return isValidLonLat(feature?.center) ? feature.center : undefined;
};

const fetchNearby = async (
  type: 'crag' | 'area',
  shortId: string,
  center: LonLat | undefined,
) => {
  const { type: osmType, id: osmId } = getApiId(shortId);
  const params = new URLSearchParams({ type });
  if (osmType && osmId > 0) {
    params.set('osmType', osmType);
    params.set('osmId', String(osmId));
  }
  if (center) {
    params.set('lon', String(center[0]));
    params.set('lat', String(center[1]));
  }
  return fetchJson<ClimbingNearbyRecord[]>(
    `${CLIMBING_TILES_HOST}api/climbing-tiles/nearby?${params}`,
    { abortableQueueName: `climbing-nearby-${type}` },
  );
};

export const nearbyShortId = (record: ClimbingNearbyRecord) =>
  getShortId({ type: record.osmType, id: record.osmId });

export const useNearbyClimbing = (type: 'crag' | 'area' | null) => {
  const current = useCurrentItem();
  const { items } = useEditContext();
  const center = useCurrentItemCenter();
  const centerKey = center?.map((value) => value.toFixed(5)).join(',') ?? '';
  const [records, setRecords] = useState<ClimbingNearbyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const { type: osmType, id: osmId } = getApiId(current.shortId);
  const canQuery = type != null && (!!center || (osmType && osmId > 0));

  useEffect(() => {
    if (!canQuery || type == null) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const parsedCenter = centerKey
      ? (centerKey.split(',').map(Number) as LonLat)
      : undefined;

    let cancelled = false;
    setLoading(true);
    fetchNearby(type, current.shortId, parsedCenter)
      .then((next) => {
        if (!cancelled) setRecords(next);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        if (!cancelled) setRecords([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canQuery, centerKey, current.shortId, type]);

  const excludedIds = new Set<string>([current.shortId]);
  for (const member of current.members ?? []) {
    excludedIds.add(member.shortId);
  }
  for (const item of items) {
    if (item.members?.some((member) => member.shortId === current.shortId)) {
      excludedIds.add(item.shortId);
    }
  }

  return {
    records: records.filter(
      (record) => !excludedIds.has(nearbyShortId(record)),
    ),
    loading,
  };
};
