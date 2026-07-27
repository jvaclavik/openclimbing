import { useEffect } from 'react';
import { PointType } from '../types';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { isTypingInFormField } from '../../../../helpers/hooks';

export const useFloatingMenuShortcuts = (
  onPointTypeChange: (type: PointType | null) => void,
  onContinueClimbingRouteClick: () => void,
  onToggleProtectionPoints: () => void,
  canUndo: boolean,
  handleUndo: (e) => void,
  canRedo: boolean,
  handleRedo: (e) => void,
  isDoneVisible: boolean,
  onFinishClimbingRouteClick: () => void,
) => {
  const { isEditMode } = useClimbingContext();

  useEffect(() => {
    const downHandler = (e) => {
      if (isTypingInFormField(e.target)) return;

      if (isEditMode) {
        // Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo. Handle first so the plain
        // letter shortcuts below don't also fire on the modified keypress.
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            if (canRedo) handleRedo(e);
          } else if (canUndo) {
            handleUndo(e);
          }
          return;
        }
        if (e.metaKey || e.ctrlKey) return;
        if (e.key === 'b') {
          onPointTypeChange('bolt');
        }
        if (e.key === 'a') {
          onPointTypeChange('anchor');
        }
        if (e.key === 's') {
          onPointTypeChange('sling');
        }
        if (e.key === 'p') {
          onPointTypeChange('piton');
        }
        if (e.key === 'u') {
          onPointTypeChange('unfinished');
        }
        if (e.key === 'n') {
          onPointTypeChange(null);
        }
        if (e.key === 'e') {
          onContinueClimbingRouteClick();
        }
        if (e.key === 'm') {
          onToggleProtectionPoints();
        }
        if (isDoneVisible && (e.key === 'Enter' || e.key === 'Escape')) {
          onFinishClimbingRouteClick();
        }
      }
    };

    window.addEventListener('keydown', downHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [
    canRedo,
    canUndo,
    handleRedo,
    handleUndo,
    isDoneVisible,
    isEditMode,
    onContinueClimbingRouteClick,
    onFinishClimbingRouteClick,
    onToggleProtectionPoints,
    onPointTypeChange,
  ]);
};
