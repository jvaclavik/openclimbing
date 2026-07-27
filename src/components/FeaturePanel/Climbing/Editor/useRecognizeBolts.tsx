import { useState } from 'react';
import { t, Translation } from '../../../../services/intl';
import { useSnackbar } from '../../../utils/SnackbarContext';
import { getCommonsImageUrl } from '../../../../services/images/getCommonsImageUrl';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { recognizeBolts } from '../utils/boltRecognition';

export const RECOGNIZE_BOLTS_REPO_URL =
  'https://github.com/zbycz/openclimbing-bolts-ai';

type Progress = { done: number; total: number } | null;

export const useRecognizeBolts = () => {
  const { photoRef, photoPath, addProtectionPoint } = useClimbingContext();
  const { showToast } = useSnackbar();
  const [isRunning, setIsRunning] = useState(false);
  // null while the model is still downloading (indeterminate spinner);
  // { done, total } once tiles start (determinate progress).
  const [progress, setProgress] = useState<Progress>(null);

  const run = async () => {
    if (isRunning) return;
    // Run on the full-resolution original (like the reference tool) so the tile
    // count — and thus detections — match; fall back to the displayed photo.
    const img = photoRef.current;
    const src =
      getCommonsImageUrl(`File:${photoPath}`, 'original') ||
      img?.currentSrc ||
      img?.src;
    if (!src) return;

    setIsRunning(true);
    setProgress(null);
    try {
      const detections = await recognizeBolts(src, (done, total) => {
        setProgress({ done, total });
      });
      detections.forEach(({ cx, cy }) => {
        addProtectionPoint({ x: cx, y: cy, type: 'bolt', units: 'percentage' });
      });
      if (detections.length === 0) {
        showToast(
          <Translation
            id="climbingpanel.recognize_bolts_none"
            tags={{
              a: `a href="${RECOGNIZE_BOLTS_REPO_URL}/issues" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline"`,
            }}
          />,
          'info',
        );
      } else {
        showToast(
          t('climbingpanel.recognize_bolts_result', {
            count: detections.length,
          }),
          'success',
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Bolt recognition failed', e);
      showToast(t('climbingpanel.recognize_bolts_error'), 'error');
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  return { run, isRunning, progress };
};
