import { saveChanges } from '../../../services/osm/auth/osmApiAuth';
import { Feature, FeatureTags, OsmId } from '../../../services/types';
import { Setter } from '../../../types';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useSnackbar } from '../../utils/SnackbarContext';
import { fetchFreshItem } from '../EditDialog/context/itemsHelpers';
import { DataItem } from '../EditDialog/context/types';
import { useClimbingContext } from './contexts/ClimbingContext';
import { ClimbingRoute, PathPoints } from './types';
import { stringifyPath } from './utils/pathUtils';
import {
  getNextWikimediaCommonsIndex,
  getWikimediaCommonsKey,
} from './utils/photo';
import { getCragProtectionTagPatch } from './utils/protectionPathTags';

const getUpdatedPhotoTags = (route: ClimbingRoute) => {
  const updatedTags = {};
  const newIndex = getNextWikimediaCommonsIndex(route.feature.tags);

  let offset = 0;
  Object.entries(route.paths).forEach(([photoName, points]) => {
    const photoKey = route.photoToKeyMap[photoName];

    if (photoKey) {
      updatedTags[`${photoKey}:path`] = stringifyPath(points);
    } else {
      const newKey = getWikimediaCommonsKey(newIndex + offset); // TODO this offset looks broken
      updatedTags[newKey] = `File:${photoName}`;
      updatedTags[`${newKey}:path`] = stringifyPath(points);
      offset += 1;
    }
  });
  return updatedTags;
};

const areUpdatedTagsSame = (
  updatedTags: FeatureTags,
  origTags: FeatureTags,
) => {
  const isSame = Object.keys(updatedTags).every(
    (key) => updatedTags[key] === origTags[key],
  );
  return isSame;
};

type ClimbingUpdate = {
  apiId: OsmId;
  updatedTags: FeatureTags;
};

const constructChanges = async (
  updates: ClimbingUpdate[],
): Promise<DataItem[]> => {
  const dataItems = [];
  for (const { apiId, updatedTags } of updates) {
    const freshItem = await fetchFreshItem(apiId);

    // we don't have to compare versions, because only :path tags are changed
    dataItems.push({
      ...freshItem,
      tagsEntries: Object.entries({
        ...Object.fromEntries(freshItem.tagsEntries),
        ...updatedTags,
      }),
    } as DataItem);
  }

  return dataItems;
};

export const getClimbingCragUpdates = (
  crag: Feature,
  photoPaths: Array<string>,
  protectionPointsByPhoto?: Record<string, PathPoints>,
): ClimbingUpdate[] => {
  const updatedTags: FeatureTags = {};
  photoPaths.forEach((photoPath, index) => {
    updatedTags[`wikimedia_commons${index === 0 ? '' : `:${index + 1}`}`] =
      `File:${photoPath}`; // TODO this may change order of wikimedia_commons:# tags, we need photoPaths to store keys as well
  });
  if (protectionPointsByPhoto) {
    Object.assign(
      updatedTags,
      getCragProtectionTagPatch(crag.tags, protectionPointsByPhoto),
    );
  }
  const apiId = crag.osmMeta;
  return areUpdatedTagsSame(updatedTags, crag.tags)
    ? []
    : [{ apiId, updatedTags }];
};

export const getClimbingRouteUpdates = (
  routes: ClimbingRoute[],
): ClimbingUpdate[] => {
  const existingRoutes = routes.filter((route) => route.feature); // TODO new routes

  return existingRoutes.flatMap((route) => {
    const updatedTags = getUpdatedPhotoTags(route);
    const apiId = route.feature.osmMeta;
    return areUpdatedTagsSame(updatedTags, route.feature.tags)
      ? []
      : [{ apiId, updatedTags }];
  });
};

export const useSaveCragFactory = (setIsEditMode: Setter<boolean>) => {
  const { feature: crag } = useFeatureContext();
  const { routes, photoPaths, protectionPointsByPhoto } = useClimbingContext();
  const { showToast } = useSnackbar();

  return async () => {
    const updates = [
      ...getClimbingRouteUpdates(routes),
      ...getClimbingCragUpdates(crag, photoPaths, protectionPointsByPhoto),
    ];

    if (updates.length === 0) {
      showToast('No changes found.', 'warning');
      return;
    }

    try {
      const changes = await constructChanges(updates);

      const comment = `${changes.length} routes`;
      const result = await saveChanges(crag, comment, changes);

      console.log('All routes saved', { updates, changes, result }); // eslint-disable-line no-console
      showToast('Data saved successfully!', 'success');
      setIsEditMode(false);
    } catch (err) {
      console.error('Failed to save climbing crag', err); // eslint-disable-line no-console
      const message =
        (err as any)?.responseText ?? (err as any)?.message ?? String(err);
      showToast(`Save failed: ${message}`, 'error');
    }
  };
};
