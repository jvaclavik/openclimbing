import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isTypingInFormField } from '../../helpers/hooks';
import { useFeatureContext } from '../utils/FeatureContext';
import { useEditDialogContext } from './helpers/EditDialogContext';

/** Alt+R reloads OSM data; Alt+E opens the edit dialog. */
export const useFeaturePanelShortcuts = () => {
  const { feature, reloadFeature, isReloading } = useFeatureContext();
  const { open, opened } = useEditDialogContext();
  const router = useRouter();
  const isClimbingDialog = router.query.all?.[2] === 'climbing';

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isTypingInFormField(e.target)) return;

      if (e.code === 'KeyR') {
        // Climbing dialog has its own handler so it can refresh routes too.
        if (isClimbingDialog) return;
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
  }, [feature, isClimbingDialog, isReloading, open, opened, reloadFeature]);
};
