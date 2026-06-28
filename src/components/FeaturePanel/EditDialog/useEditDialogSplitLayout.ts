import { useMediaQuery } from '@mui/material';

// Same breakpoint as the climbing crag view (useGetCragViewLayout), but
// context-free: the edit dialog can be opened from the plain FeaturePanel,
// which is not inside ClimbingContext.
const SPLIT_LAYOUT_BREAKPOINT_PX = 1080;

/**
 * `vertical` → panes side by side (map on the right) on wide screens.
 * `horizontal` → panes stacked (map at the bottom) on narrow screens.
 * Matches react-split-pane's `split` prop semantics.
 */
export const useEditDialogSplitLayout = (): 'vertical' | 'horizontal' => {
  const isWide = useMediaQuery(`(min-width:${SPLIT_LAYOUT_BREAKPOINT_PX}px)`);
  return isWide ? 'vertical' : 'horizontal';
};
