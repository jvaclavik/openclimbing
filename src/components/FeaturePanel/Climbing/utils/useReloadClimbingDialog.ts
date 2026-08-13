import { useCallback } from 'react';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { confirmDiscardUnsavedClimbingEdits } from './confirmDiscardUnsavedClimbingEdits';

/** Reloads OSM data and replaces routes/photos in the climbing dialog. */
export const useReloadClimbingDialog = () => {
  const { feature, reloadFeature, isReloading } = useFeatureContext();
  const { hasUnsavedEdits, discardEdits } = useClimbingContext();

  const reload = useCallback(async () => {
    if (!feature || feature.point || feature.nonOsmObject || isReloading) {
      return;
    }
    if (!confirmDiscardUnsavedClimbingEdits(hasUnsavedEdits)) {
      return;
    }
    if (hasUnsavedEdits) {
      discardEdits();
    }
    await reloadFeature(true);
  }, [discardEdits, feature, hasUnsavedEdits, isReloading, reloadFeature]);

  return { reload, isReloading };
};
