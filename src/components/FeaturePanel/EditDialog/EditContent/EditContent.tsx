import {
  DialogContent,
  IconButton,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import SplitPane from 'react-split-pane';
import { EditDialogActions } from './EditDialogActions';
import { CommentField } from './CommentField';
import { OsmUserLogged } from './OsmUserLogged';
import { ContributionInfoBox } from './ContributionInfoBox';
import { OsmUserLoggedOut } from './OsmUserLoggedOut';
import { TestApiWarning } from '../../helpers/TestApiWarning';
import { ItemsTabs } from './ItemsTabs';
import { ItemEditSection } from './ItemEditSection';
import { t } from '../../../../services/intl';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { getSplitPaneDefaultSize } from '../../Climbing/config';
import { useEditDialogSplitLayout } from '../useEditDialogSplitLayout';

const EditDialogMapDynamic = dynamic(() => import('../EditDialogMap'), {
  ssr: false,
  loading: () => <div style={{ height: '100%' }} />,
});

// Mirrors the resizer styling of the climbing crag view's SplitPane so the
// divider looks and behaves the same in both places.
const SplitContainer = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  .Resizer {
    &.horizontal {
      cursor: row-resize;
      height: 15px;
      margin: -7px 0;
      &::before {
        width: 40px;
        height: 12px;
        content: '...';
        justify-content: center;
        align-items: unset;
      }
      &::after {
        border-top: solid 1px #222;
        width: 100%;
        height: 1px;
        margin-top: 1px;
      }
    }
    &.vertical {
      width: 15px;
      cursor: col-resize;
      margin: 0 -7px;
      &::before {
        width: 12px;
        height: 40px;
        content: '⋮';
      }
      &::after {
        border-left: solid 1px #222;
        height: 100%;
        width: 1px;
      }
    }

    z-index: 100000;
    display: flex;
    justify-content: center;
    align-items: center;
    &::before {
      position: absolute;
      display: flex;
      align-items: center;
      border-radius: 6px;
      background: ${({ theme }) => theme.palette.background.paper};
      margin-top: 1px;
      z-index: 1;
      transition: all 0.1s ease;
      border: solid 1px ${({ theme }) => theme.palette.divider};
      text-align: center;
      line-height: 0px;
      font-size: 20px;
      color: ${({ theme }) => theme.palette.primary.main};
      letter-spacing: 1px;
    }
    &::after {
      position: absolute;
      content: '';
      transition: all 0.1s ease;
    }
  }
`;

const MapPane = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
`;

// The restore button stays pinned 20px from the edge the map collapsed
// against (right edge for side-by-side, bottom edge for stacked) so it doesn't
// drift while the user is shrinking the map.
const RestoreCollapsedMapButton = styled.div<{
  $layout: 'vertical' | 'horizontal';
}>`
  position: absolute;
  z-index: 1002;
  right: 20px;
  ${({ $layout }) => ($layout === 'vertical' ? 'top: 20px;' : 'bottom: 20px;')}
`;

// Once the map pane shrinks below this (along the split axis) the divider is
// too cramped to drag back, so we snap the map fully closed and surface a
// restore button instead — same idea as the climbing crag view's restore arrow.
const MAP_PANE_COLLAPSED_THRESHOLD_PX = 100;

// Sentinel pane1 (form) size that pushes the map pane down to 0px. pane1Style's
// maxWidth/maxHeight: 100% clamps the form back to the container, so the actual
// rendered layout is fine on any screen. Stored until the restore button resets
// it back to the default split.
const COLLAPSED_PANE_SIZE_PX = 100000;

// Watches the map pane size and, once it shrinks past the threshold, snaps the
// map fully closed (0px) so the restore button can take over. Returns the ref
// to attach to the map pane, whether the map is collapsed, and a drag-state
// setter for the split divider.
const useMapPaneCollapse = (layout: 'vertical' | 'horizontal') => {
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const splitPaneSize = userSettings['editdialog.splitPaneSize'];
  const mapPaneRef = useRef<HTMLDivElement>(null);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const node = mapPaneRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dim = layout === 'horizontal' ? height : width;
      setIsMapCollapsed(dim < MAP_PANE_COLLAPSED_THRESHOLD_PX);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [layout]);

  // Skip while dragging (react-split-pane owns the size then) and when
  // splitPaneSize is null — that's the just-restored state where the map hasn't
  // visually grown yet, so re-snapping would flash it open and closed.
  useEffect(() => {
    if (
      isMapCollapsed &&
      !isDragging &&
      splitPaneSize != null &&
      splitPaneSize !== COLLAPSED_PANE_SIZE_PX
    ) {
      setUserSetting('editdialog.splitPaneSize', COLLAPSED_PANE_SIZE_PX);
    }
  }, [isMapCollapsed, isDragging, splitPaneSize, setUserSetting]);

  return { mapPaneRef, isMapCollapsed, setIsDragging };
};

const FormPane: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Stack
      direction={isSmallScreen ? 'column' : 'row'}
      gap={1}
      overflow="hidden"
      height="100%"
      sx={{ borderTop: `solid 1px ${theme.palette.divider}` }}
    >
      <ItemsTabs />
      <DialogContent dividers sx={{ flex: 1, borderTop: 0 }}>
        <form
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
          style={{ height: '100%' }}
        >
          <OsmUserLoggedOut />

          <Stack height="100%">
            <Stack flex={1}>
              <ItemEditSection />
            </Stack>
            <CommentField />
            <ContributionInfoBox />
            <OsmUserLogged />
            <TestApiWarning />
          </Stack>
        </form>
      </DialogContent>
    </Stack>
  );
};

export const EditContent = () => {
  const layout = useEditDialogSplitLayout();
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const splitPaneSize = userSettings['editdialog.splitPaneSize'];

  const { mapPaneRef, isMapCollapsed, setIsDragging } =
    useMapPaneCollapse(layout);

  return (
    <>
      <SplitContainer>
        <SplitPane
          split={layout}
          minSize={260}
          size={splitPaneSize ?? getSplitPaneDefaultSize(layout)}
          onDragStarted={() => setIsDragging(true)}
          onDragFinished={(size: number) => {
            setUserSetting('editdialog.splitPaneSize', size);
            setIsDragging(false);
          }}
          pane1Style={
            layout === 'vertical' ? { maxWidth: '100%' } : { maxHeight: '100%' }
          }
          pane2Style={
            layout === 'vertical' ? { minWidth: 0 } : { minHeight: 0 }
          }
        >
          <FormPane />
          <MapPane ref={mapPaneRef}>
            <EditDialogMapDynamic />
          </MapPane>
        </SplitPane>
        {isMapCollapsed && (
          <RestoreCollapsedMapButton $layout={layout}>
            <Tooltip title={t('editdialog.enlarge_map')} arrow>
              <IconButton
                size="small"
                color="secondary"
                aria-label={t('editdialog.enlarge_map')}
                sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
                onClick={() => setUserSetting('editdialog.splitPaneSize', null)}
              >
                <MapIcon />
              </IconButton>
            </Tooltip>
          </RestoreCollapsedMapButton>
        )}
      </SplitContainer>
      <EditDialogActions />
    </>
  );
};
