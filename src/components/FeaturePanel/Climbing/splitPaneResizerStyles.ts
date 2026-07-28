import { css, Theme } from '@emotion/react';
import { grey } from '@mui/material/colors';

// Shared styling for the react-split-pane divider (".Resizer"). Used by the
// climbing crag view and the edit dialog so the handle looks and drags the
// same in both places. Deliberately understated: a small rounded grab pill
// (mirroring the bottom-sheet Puller) sitting over a very faint divider line,
// with a generous invisible hit area so it's easy to grab — especially by
// touch, where `touch-action: none` stops the drag from turning into a scroll.
export const splitPaneResizerStyles = (theme: Theme) => css`
  .Resizer {
    z-index: 100000;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
    touch-action: none;

    &::after {
      content: '';
      position: absolute;
      background-color: ${theme.palette.divider};
      opacity: 0.5;
      transition: opacity 0.15s ease;
    }
    &::before {
      content: '';
      position: absolute;
      z-index: 1;
      border-radius: 999px;
      background-color: ${theme.palette.mode === 'light'
        ? grey[400]
        : grey[700]};
      transition:
        background-color 0.15s ease,
        transform 0.15s ease;
    }

    &.horizontal {
      height: 24px;
      margin: -12px 0;
      cursor: row-resize;
      &::after {
        left: 0;
        right: 0;
        height: 1px;
      }
      &::before {
        width: 36px;
        height: 5px;
      }
    }
    &.vertical {
      width: 24px;
      margin: 0 -12px;
      cursor: col-resize;
      &::after {
        top: 0;
        bottom: 0;
        width: 1px;
      }
      &::before {
        width: 5px;
        height: 36px;
      }
    }

    &:hover::after,
    &:active::after {
      opacity: 1;
    }
    &:hover::before,
    &:active::before {
      background-color: ${theme.palette.primary.main};
      transform: scale(1.15);
    }
  }
`;
