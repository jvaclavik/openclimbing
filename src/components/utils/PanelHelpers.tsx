import styled from '@emotion/styled';
import React, { Ref } from 'react';
import { isDesktop } from '../helpers';
import { SEARCH_BOX_HEIGHT } from '../SearchBox/consts';

export const FEATURE_PANEL_WIDTH = 480;

const PanelMain = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const MARGIN = 0;

const Container = styled.div`
  position: absolute;
  left: ${MARGIN}px;
  bottom: ${MARGIN}px;
  top: ${SEARCH_BOX_HEIGHT + MARGIN}px;
  background: ${({ theme }) => theme.palette.background.default};
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  color: ${({ theme }) => theme.palette.text.primary};
  overflow: hidden;
  z-index: 1100;

  width: 100%;
  @media ${isDesktop} {
    width: ${FEATURE_PANEL_WIDTH}px;
  }
`;

export const PanelWrapper = ({ children }) => (
  <Container>
    <PanelMain>{children}</PanelMain>
  </Container>
);

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
`;
