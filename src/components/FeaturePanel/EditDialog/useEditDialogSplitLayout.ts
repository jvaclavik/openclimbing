import { useMediaQuery } from '@mui/material';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';

// Same breakpoint as the climbing crag view (useGetCragViewLayout), but
// context-free: the edit dialog can be opened from the plain FeaturePanel,
// which is not inside ClimbingContext.
const SPLIT_LAYOUT_BREAKPOINT_PX = 1080;

/**
 * `vertical` → panes side by side (map on the right) on wide screens.
 * `horizontal` → panes stacked (map at the bottom) on narrow screens.
 * Matches react-split-pane's `split` prop semantics.
 *
 * The user can force a fixed position in the map settings; `auto` (default)
 * keeps the responsive behaviour based on the viewport width.
 */
export const useEditDialogSplitLayout = (): 'vertical' | 'horizontal' => {
  const { userSettings } = useUserSettingsContext();
  const mapPosition = userSettings['editdialog.mapPosition'] ?? 'auto';
  const isWide = useMediaQuery(`(min-width:${SPLIT_LAYOUT_BREAKPOINT_PX}px)`);

  if (mapPosition === 'right') return 'vertical';
  if (mapPosition === 'bottom') return 'horizontal';
  return isWide ? 'vertical' : 'horizontal';
};
