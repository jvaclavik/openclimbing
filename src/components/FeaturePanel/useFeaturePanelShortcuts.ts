import { useEffect } from 'react';
import { isTypingInFormField } from '../../helpers/hooks';
import { useFeatureContext } from '../utils/FeatureContext';
import { useEditDialogContext } from './helpers/EditDialogContext';

/** Alt+R reloads OSM data; Alt+E opens the edit dialog. */
export const useFeaturePanelShortcuts = () => {
  const { feature, reloadFeature, isReloading } = useFeatureContext();
  const { open, opened } = useEditDialogContext();

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isTypingInFormField(e.target)) return;

      if (e.code === 'KeyR') {
        if (feature.point || feature.nonOsmObject || isReloading) return;
        e.preventDefault();
        void reloadFeature(true);
        return;
      }

      if (e.code === 'KeyE') {
        if (opened || feature.skeleton) return;
        e.preventDefault();
        open();
      }
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [feature, isReloading, open, opened, reloadFeature]);
};
