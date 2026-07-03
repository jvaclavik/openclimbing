import React, { useState } from 'react';
import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { t, Translation } from '../../../../services/intl';
import { TooltipButton } from '../../../utils/TooltipButton';
import { useSnackbar } from '../../../utils/SnackbarContext';
import { getCommonsImageUrl } from '../../../../services/images/getCommonsImageUrl';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { recognizeBolts } from '../utils/boltRecognition';

const REPO_URL = 'https://github.com/zbycz/openclimbing-bolts-ai';

// A neutral (grey) contained-button look. It is intentionally "fake": the root
// is a plain div so the clickable label and the (i) info button can live side
// by side without nesting <button> in <button>.
const Root = styled.div<{ $disabled: boolean }>`
  pointer-events: all;
  display: inline-flex;
  align-items: center;
  height: 30.75px;
  border-radius: 4px;
  overflow: hidden;
  text-transform: uppercase;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.02857em;
  box-shadow:
    0px 3px 1px -2px rgba(0, 0, 0, 0.2),
    0px 2px 2px 0px rgba(0, 0, 0, 0.14),
    0px 1px 5px 0px rgba(0, 0, 0, 0.12);
  background-color: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[300]};
  color: ${({ theme }) =>
    theme.palette.getContrastText(
      theme.palette.mode === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[300],
    )};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
`;

// Only this left part is clickable and triggers the recognition.
const Label = styled.button`
  appearance: none;
  border: 0;
  margin: 0;
  height: 100%;
  padding: 0 6px 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
  &:not(:disabled):hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
  & svg {
    font-size: 1.15rem;
  }
`;

// Holds the (i) info button, or the spinner while running. Sits inside the
// button but is a separate control, so clicking it never starts inference.
const InfoSlot = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 100%;
`;

const tooltipContent = (
  <>
    {t('climbingpanel.recognize_bolts_tooltip')}{' '}
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'inherit', textDecoration: 'underline' }}
    >
      GitHub
    </a>
  </>
);

export const RecognizeBoltsButton = () => {
  const { photoRef, photoPath, addProtectionPoint } = useClimbingContext();
  const { showToast } = useSnackbar();
  const [isRunning, setIsRunning] = useState(false);
  // null while the model is still downloading (indeterminate spinner);
  // { done, total } once tiles start (determinate progress).
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const handleClick = async () => {
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
              a: `a href="${REPO_URL}/issues" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline"`,
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

  return (
    <Root $disabled={isRunning}>
      <Label type="button" onClick={handleClick} disabled={isRunning}>
        <AutoAwesomeIcon />
        {t('climbingpanel.recognize_bolts')}
      </Label>
      <InfoSlot>
        {isRunning ? (
          <CircularProgress
            size={16}
            color="inherit"
            variant={progress ? 'determinate' : 'indeterminate'}
            value={
              progress && progress.total
                ? (progress.done / progress.total) * 100
                : undefined
            }
          />
        ) : (
          <TooltipButton
            tooltip={tooltipContent}
            sx={{ p: 0.25, fontSize: '1.15rem', color: 'inherit' }}
          />
        )}
      </InfoSlot>
    </Root>
  );
};
