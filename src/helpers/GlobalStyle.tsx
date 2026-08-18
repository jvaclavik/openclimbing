import { css, Global, Theme } from '@emotion/react';
import { isMobileMode } from '../components/helpers';
import { convertHexToRgba } from '../components/utils/colorUtils';

// This function doesn't contain any logic - so no extraction needed.
// eslint-disable-next-line max-lines-per-function
const globalStyle = (theme: Theme) => css`
  html,
  body,
  #__next {
    margin: 0;
    padding: 0;
    height: 100%;
    border: 0;
    font-family: 'Source Sans 3', sans-serif;
    background-color: ${theme.palette.background.default};

    // disable pulling the page around on mobile (pull-to-refresh),
    // but keep horizontal axis on 'auto' so Chrome back gesture works
    overscroll-behavior-y: none;
  }

  body {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  // On touch devices, disable text selection by default. iOS Safari can
  // initiate a selection loupe during multi-tap gestures even when only
  // descendants have user-select:none; applying it at the root reliably
  // suppresses the loupe everywhere. Form fields handle their own
  // selection natively; specific text-content elements opt back in with
  // 'user-select: text' (e.g. ClimbingRouteTableRow).
  @media (hover: none) and (pointer: coarse) {
    html,
    body {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
  }

  a,
  .linkLikeButton {
    color: ${theme.palette.tertiary
      .main}; // CAREFUL: Emotion doesn't apply Dark style in dev mode
    text-decoration: none;
    border: 0;
    padding: 0;
    font: inherit;
    background: transparent;
    outline: 0;
    cursor: pointer;
    &.colorInherit {
      color: inherit;
    }
    &:hover {
      text-decoration: underline;
    }
    &:focus {
      text-decoration: underline;
    }
    .MuiTooltip-tooltip & {
      color: #82dcff;
    }
  }

  ul {
    margin-top: 0;
  }

  .maplibregl-map,
  .maplibregl-map * {
    // Apply to all descendants too — iOS Safari can still start text selection
    // / show the magnifier loupe on inner elements (canvas, markers) during
    // gestures like double-tap-then-hold-and-drag (TapDragZoom) where it
    // interprets the held touch as a selection start.
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-user-drag: none;
  }
  .maplibregl-ctrl-bottom-right {
    bottom: 50px !important;
  }
  .edit-feature-map .maplibregl-ctrl-bottom-right {
    bottom: 0px !important;
  }
  .maplibregl-ctrl-scale {
    background-color: hsla(0, 0%, 100%, 0.5) !important;
  }

  .maplibregl-ctrl-group {
    background-color: ${convertHexToRgba(
      theme.palette.background.paper,
      0.8,
    )} !important;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border-radius: 12px !important;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    max-height: calc(
      100vh - 300px
    ); // = top right controls + right bottom + safety margin (TEST also in landscape)
    overflow-x: hidden;
    overflow-y: auto; // especially for indoor selector at the Louvre #18/48.8610/2.3389 :)

    .maplibregl-ctrl-icon {
      filter: ${theme.palette.invertFilter};
    }

    button + button {
      border-top: 1px solid ${theme.palette.divider} !important;
    }
  }

  /* Navigation (+ / − / compass): one glass button group */
  .maplibregl-ctrl-group:has(> .maplibregl-ctrl-zoom-in) {
    overflow: hidden;
    border-radius: 16px !important;
    display: flex;
    flex-direction: column;

    button {
      width: 40px !important;
      height: 40px !important;
      background: transparent !important;
      box-shadow: none !important;
      border-radius: 0 !important;

      &:focus:first-child,
      &:focus:last-child,
      &:focus:only-child {
        border-radius: 0 !important;
      }

      &:focus:not(:focus-visible) {
        box-shadow: none;
      }

      &:focus:focus-visible {
        box-shadow: inset 0 0 0 2px ${theme.palette.primary.main};
      }
    }
  }

  /* Geolocate + compass-only: circular glass like MapControlButton */
  .maplibregl-ctrl-group:has(> .maplibregl-ctrl-geolocate),
  .maplibregl-ctrl-group:has(> .maplibregl-ctrl-compass):not(
      :has(> .maplibregl-ctrl-zoom-in)
    ) {
    background: transparent !important;
    box-shadow: none !important;
    overflow: visible;

    button + button {
      border-top: 0 !important;
    }

    button {
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      background-color: ${convertHexToRgba(
        theme.palette.background.paper,
        0.8,
      )} !important;
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);

      &:focus:first-child,
      &:focus:last-child,
      &:focus:only-child {
        border-radius: 50% !important;
      }

      &:focus:not(:focus-visible) {
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
      }

      &:focus:focus-visible {
        box-shadow:
          0 0 0 2px rgba(0, 0, 0, 0.1),
          0 0 0 4px ${theme.palette.primary.main};
      }
    }
  }

  @media (hover: hover) {
    .maplibregl-ctrl-group:has(> .maplibregl-ctrl-zoom-in)
      button:not(:disabled):hover {
      background-color: ${convertHexToRgba(
        theme.palette.background.paper,
        1,
      )} !important;
    }

    .maplibregl-ctrl-group:has(> .maplibregl-ctrl-geolocate)
      button:not(:disabled):hover,
    .maplibregl-ctrl-group:has(> .maplibregl-ctrl-compass):not(
        :has(> .maplibregl-ctrl-zoom-in)
      )
      button:not(:disabled):hover {
      background-color: ${theme.palette.background.paper} !important;
    }
  }

  /* Push the native map controls below the global TopBar (68px) */
  .maplibregl-ctrl-top-right {
    top: 76px !important;
    right: 6px !important;
  }
  .maplibregl-ctrl-top-right .maplibregl-ctrl {
    margin: 0 0 8px 0 !important;
  }

  /* Mobile: 8px under the top-bar icons
     (icon top 6 + 44px height → bottom 50 → 50 + 8 = 58). */
  @media ${isMobileMode} {
    .maplibregl-ctrl-top-right {
      top: 58px !important;
    }
    .maplibregl-ctrl-group:has(> .maplibregl-ctrl-zoom-in) button,
    .maplibregl-ctrl-group:has(> .maplibregl-ctrl-geolocate) button,
    .maplibregl-ctrl-group:has(> .maplibregl-ctrl-compass):not(
        :has(> .maplibregl-ctrl-zoom-in)
      )
      button {
      width: 44px !important;
      height: 44px !important;
    }
  }

  .edit-feature-map .maplibregl-ctrl-top-right {
    top: 35px !important;
  }

  .maplibregl-canvas:not(:focus) {
    outline: 0;
  }

  @keyframes blink {
    50% {
      color: transparent;
    }
  }

  .dotloader {
    animation: 1s blink infinite;
  }

  .dotloader:nth-of-type(2) {
    animation-delay: 250ms;
  }

  .dotloader:nth-of-type(3) {
    animation-delay: 500ms;
  }

  .MuiBackdrop-root {
    background-color: rgba(0, 0, 0, 0.2) !important;
  }

  /* Hide compass by default - selects .maplibregl-ctrl which holds [+,-,compass] */
  .hidden-compass .maplibregl-ctrl:has(> .maplibregl-ctrl-compass) {
    display: none;
  }

  .MuiAutocomplete-noOptions {
    padding: 0;
  }
`;

// CAREFUL: Emotion doesn't apply Dark style in dev mode
export const GlobalStyle = () => <Global styles={globalStyle} />;
