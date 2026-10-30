import styled from '@emotion/styled';
import React, { Ref } from 'react';
import SplitPane from 'react-split-pane';
import { SEARCH_BOX_HEIGHT } from '../SearchBox/consts';
import { splitPaneResizerStyles } from '../FeaturePanel/Climbing/splitPaneResizerStyles';
import {
  FEATURE_PANEL_MIN_WIDTH,
  getFeaturePanelMaxWidth,
  setFeaturePanelWidth,
  useFeaturePanelWidth,
  useViewportWidth,
} from './featurePanelWidth';
import { useUserSettingsContext } from './userSettings/UserSettingsContext';

const PanelMain = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

// The panel floats over the full-width map (bbox/center maths rely on that), so
// the split pane is an overlay whose empty second pane lets the map get clicks.
const SplitOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: ${SEARCH_BOX_HEIGHT}px;
  z-index: 1100;
  pointer-events: none;

  ${({ theme }) => splitPaneResizerStyles(theme)}
`;

const Container = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.palette.background.default};
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  color: ${({ theme }) => theme.palette.text.primary};
  overflow: hidden;
`;

const INTERACTIVE = { pointerEvents: 'auto' } as const;

export const PanelWrapper = ({ children }) => {
  const width = useFeaturePanelWidth();
  const viewportWidth = useViewportWidth();
  const { setUserSetting } = useUserSettingsContext();

  return (
    <SplitOverlay>
      <SplitPane
        split="vertical"
        size={width}
        minSize={FEATURE_PANEL_MIN_WIDTH}
        maxSize={getFeaturePanelMaxWidth(viewportWidth)}
        onChange={(size: number) => setFeaturePanelWidth(size)}
        onDragFinished={(size?: number) => {
          if (typeof size === 'number') setUserSetting('panel.width', size);
        }}
        pane1Style={INTERACTIVE}
        resizerStyle={INTERACTIVE}
      >
        <Container>
          <PanelMain>{children}</PanelMain>
        </Container>
        <div />
      </SplitPane>
    </SplitOverlay>
  );
};

type PanelScrollbarsProps = {
  children: React.ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
};

const ScrollArea = styled.div`
  // flex when inside PanelContent; height when a direct PanelMain child
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
`;

export const PanelScrollbars = ({
  children,
  scrollRef,
}: PanelScrollbarsProps) => <ScrollArea ref={scrollRef}>{children}</ScrollArea>;

export const PanelContent = styled.main<{ $grow?: boolean }>`
  display: flex;
  flex-direction: column;
  ${({ $grow }) =>
    $grow
      ? // mobile feature sheet: grow with content so the drawer scroller + sticky work
        `min-height: 100%;`
      : // default: fill the panel so PanelScrollbars gets a bounded height
        `height: 100%;
         min-height: 0;`}
`;

export const PanelFooterWrapper = styled.footer`
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-top: auto;
  padding-bottom: 15px;
  font-size: 1rem;
  line-height: 1.5;
`;

export const PANEL_GAP = '16px';

// Everything that lines up with the panel edge measures from here. Cards that
// embed panel content (crags in an area) narrow the rhythm down by setting
// `--content-gap` on themselves, so their children need no extra props.
export const CONTENT_GAP = `var(--content-gap, ${PANEL_GAP})`;

export const PanelSidePadding = styled.div`
  padding: 0 ${CONTENT_GAP};
  min-width: 0;
`;
