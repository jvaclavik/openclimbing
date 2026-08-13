import { useEffect, useRef, MutableRefObject } from 'react';
import { Feature } from '../../../../services/types';
import { Setter } from '../../../../types';
import { ClimbingRoute, PathPoints } from '../types';
import { parseProtectionPointsByPhoto } from './protectionPathTags';
import { osmToClimbingRoutes } from '../contexts/osmToClimbingRoutes';
import { getWikimediaCommonsPhotoValues, removeFilePrefix } from './photo';

const clone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

type EditSnapshot = {
  routes: Array<ClimbingRoute>;
  protectionPointsByPhoto: Record<string, PathPoints>;
};

const collectPhotoPaths = (
  routes: Array<ClimbingRoute>,
  cragPhotos: string[],
) =>
  routes.reduce<string[]>((acc, route) => {
    if (!route.paths) return acc;
    return [...new Set([...acc, ...cragPhotos, ...Object.keys(route.paths)])];
  }, cragPhotos);

/** When `feature` is replaced (Alt+R / reload), refresh routes in the dialog. */
export const useSyncClimbingFromFeature = ({
  feature,
  isEditMode,
  hasUnsavedEdits,
  setRoutes,
  setProtectionPointsByPhoto,
  setPhotoPaths,
  setEditSnapshot,
  editSnapshotRef,
}: {
  feature: Feature;
  isEditMode: boolean;
  hasUnsavedEdits: boolean;
  setRoutes: Setter<Array<ClimbingRoute>>;
  setProtectionPointsByPhoto: Setter<Record<string, PathPoints>>;
  setPhotoPaths: Setter<string[]>;
  setEditSnapshot: Setter<EditSnapshot | null>;
  editSnapshotRef: MutableRefObject<EditSnapshot | null>;
}) => {
  const isEditModeRef = useRef(isEditMode);
  isEditModeRef.current = isEditMode;
  const hasUnsavedEditsRef = useRef(hasUnsavedEdits);
  hasUnsavedEditsRef.current = hasUnsavedEdits;
  const skipInitialSyncRef = useRef(true);

  useEffect(() => {
    if (skipInitialSyncRef.current) {
      skipInitialSyncRef.current = false;
      return;
    }
    if (isEditModeRef.current && hasUnsavedEditsRef.current) {
      return;
    }
    const nextRoutes = osmToClimbingRoutes(feature);
    const nextProtection = parseProtectionPointsByPhoto(feature.tags);
    const cragPhotos = getWikimediaCommonsPhotoValues(feature.tags).map(
      removeFilePrefix,
    );
    setRoutes(nextRoutes);
    setProtectionPointsByPhoto(nextProtection);
    setPhotoPaths(collectPhotoPaths(nextRoutes, cragPhotos));
    if (isEditModeRef.current) {
      const snapshot = {
        routes: clone(nextRoutes),
        protectionPointsByPhoto: clone(nextProtection),
      };
      editSnapshotRef.current = snapshot;
      setEditSnapshot(snapshot);
    }
  }, [
    editSnapshotRef,
    feature,
    setEditSnapshot,
    setPhotoPaths,
    setProtectionPointsByPhoto,
    setRoutes,
  ]);
};
