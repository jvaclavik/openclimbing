import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import React, { LegacyRef, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useScrollShadow } from '../FeaturePanel/Climbing/utils/useScrollShadow';
import { isDesktop, useMobileMode } from '../helpers';
import { SEARCH_BOX_HEIGHT } from '../SearchBox/consts';

export const FEATURE_PANEL_WIDTH = 480;

// custom scrollbar
// better: https://github.com/rommguy/react-custom-scroll
// maybe https://github.com/malte-wessel/react-custom-scrollbars (larger)
const EffectiveHeight = styled.main`
  height: calc(100% - ${SEARCH_BOX_HEIGHT}px);
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
  //border-radius: 20px;
  backdrop-filter: blur(50px);

  width: 100%;
  @media ${isDesktop} {
    width: ${FEATURE_PANEL_WIDTH}px;
  }

  & > div > div {
    // disable pulling panel around on mobile
    // second div due to implementation of react-custom-scrollbars
    overscroll-behavior: none;
    overscroll-behavior-y: auto;
  }
`;

export const PanelWrapper = ({ children }) => (
  <Container>
    <EffectiveHeight>{children}</EffectiveHeight>
  </Container>
);

type PanelScrollbarsProps = {
  children: React.ReactNode;
  scrollRef?: LegacyRef<Scrollbars>;
};

const MobileScrollbars = styled.div`
  height: 100%;
  overflow: auto;
`;

export const PanelScrollbars = ({
  children,
  scrollRef,
}: PanelScrollbarsProps) => {
  const isMobileMode = useMobileMode();
  const newRef = useRef<Scrollbars>(null);
  const ref = scrollRef || newRef;
  const theme = useTheme();

  // @TODO refresh on panel height first update

  const {
    scrollElementRef,
    onScroll,
    ShadowContainer,
    ShadowTop,
    ShadowBottom,
  } = useScrollShadow(undefined, ref);

  return (
    <ShadowContainer>
      <ShadowTop backgroundColor={theme.palette.background.paper} />
      {isMobileMode ? (
        <MobileScrollbars onScroll={onScroll} ref={scrollElementRef}>
          {children}
        </MobileScrollbars>
      ) : (
        <>
          <noscript
            // react-custom-scrollbars renders the view with overflow:hidden until
            // its componentDidMount switches it to scroll – without JS the panel
            // would never become scrollable, so re-enable native scrolling here
            dangerouslySetInnerHTML={{
              __html: `<style>.panel-ssr-scroll > :first-child { overflow: auto !important; }</style>`,
            }}
          />
          <Scrollbars
            universal
            autoHide
            className="panel-ssr-scroll"
            style={{ height: '100%' }}
            onScroll={onScroll}
            ref={scrollElementRef}
          >
            {children}
          </Scrollbars>
        </>
      )}

      <ShadowBottom backgroundColor={theme.palette.background.paper} />
    </ShadowContainer>
  );
};

export const PanelContent = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const PanelFooterWrapper = styled.footer`
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-top: auto;
  padding-bottom: 15px;
  font-size: 1rem;
  line-height: 1.5;
`;

export const PANEL_GAP = '16px';

export const PanelSidePadding = styled.div`
  padding: 0 ${PANEL_GAP};
`;
