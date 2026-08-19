import { useState } from 'react';
import {
  alpha,
  Box,
  CircularProgress,
  ClickAwayListener,
  Divider,
  Fade,
  Paper,
  Popper,
  Stack,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import React from 'react';
import styled from '@emotion/styled';
import { Placement } from '@popperjs/core';
import { t } from '../../services/intl';

const styles = {
  arrow: {
    position: 'absolute',
    fontSize: 7,
    width: '3em',
    height: '3em',
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    },
  },
};

const ELEVATION = 8;

// Frosted card over the map: opaque enough for text/chips/sliders to stay
// readable, still slightly translucent so the map peeks through.
export const GLASS_PAPER_SX: SxProps<Theme> = {
  backgroundColor: (theme) =>
    alpha(
      theme.palette.background.paper,
      theme.palette.mode === 'dark' ? 0.88 : 0.94,
    ),
  backdropFilter: 'blur(22px) saturate(1.35)',
  WebkitBackdropFilter: 'blur(22px) saturate(1.35)',
  border: (theme) =>
    `1px solid ${alpha(
      theme.palette.text.primary,
      theme.palette.mode === 'dark' ? 0.16 : 0.1,
    )}`,
  boxShadow: (theme) =>
    theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.55)'
      : '0 12px 36px rgba(0, 0, 0, 0.18)',
  borderRadius: '12px',
};

const StyledPopper = styled(Popper)(({ theme }) => {
  const bg = theme.palette.background.paper;
  return {
    '&[data-popper-placement*="bottom"] .arrow': {
      top: 0,
      left: 0,
      marginTop: '-0.9em',
      width: '3em',
      height: '1em',
      '&::before': {
        borderWidth: '0 1em 1em 1em',
        borderColor: `transparent transparent ${bg} transparent`,
      },
    },
    '&[data-popper-placement*="top"] .arrow': {
      bottom: 0,
      left: 0,
      marginBottom: '-0.9em',
      width: '3em',
      height: '1em',
      '&::before': {
        borderWidth: '1em 1em 0 1em',
        borderColor: `${bg} transparent transparent transparent`,
      },
    },
    '&[data-popper-placement*="right"] .arrow': {
      left: 0,
      marginLeft: '-0.9em',
      height: '3em',
      width: '1em',
      '&::before': {
        borderWidth: '1em 1em 1em 0',
        borderColor: `transparent ${bg} transparent transparent`,
      },
    },
    '&[data-popper-placement*="left"] .arrow': {
      right: 0,
      marginRight: '-0.9em',
      height: '3em',
      width: '1em',
      '&::before': {
        borderWidth: '1em 0 1em 1em',
        borderColor: `transparent transparent transparent ${bg}`,
      },
    },
  };
});

type PopperWithArrowProps = {
  children: React.ReactNode;
  addition?: React.ReactNode;
  isOpen: boolean;
  anchorEl: any;
  title: React.ReactNode;
  placement?: Placement;
  offset?: number[];
  sx?: React.CSSProperties;
  paperSx?: SxProps<Theme>;
  loading?: boolean;
  onClickAway?: (event: MouseEvent | TouchEvent) => void;
};

export const PopperWithArrow = ({
  children,
  addition,
  isOpen,
  anchorEl,
  title,
  placement,
  offset = [0, 0],
  sx,
  paperSx,
  loading,
  onClickAway,
}: PopperWithArrowProps) => {
  const [arrowRef, setArrowRef] = useState<HTMLElement | null>(null);

  return (
    <StyledPopper
      open={isOpen}
      anchorEl={anchorEl}
      transition
      placement={placement}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset,
          },
        },
        {
          name: 'arrow',
          options: {
            enabled: true,
            element: arrowRef,
          },
        },
        {
          name: 'flip',
          options: {
            padding: 8,
          },
        },
        {
          // Keep the popper fully inside the viewport even when the anchor sits
          // in a screen corner (e.g. the map filter button). Without tether:false
          // popper.js lets a tall popover overflow off-screen to stay glued to the
          // anchor, which on mobile hid the whole panel behind the backdrop.
          name: 'preventOverflow',
          options: {
            altAxis: true,
            tether: false,
            padding: 8,
          },
        },
      ]}
      sx={{ zIndex: 1300, ...sx }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <div>
            <ClickAwayListener
              onClickAway={onClickAway ?? (() => {})}
              mouseEvent={onClickAway ? 'onClick' : false}
              touchEvent={onClickAway ? 'onTouchEnd' : false}
            >
              <div>
                <Box
                  component="span"
                  className="arrow"
                  ref={setArrowRef}
                  sx={styles.arrow}
                />
                <Paper
                  elevation={ELEVATION}
                  sx={{
                    // Never grow taller than the viewport; keep the header pinned
                    // and let the body scroll so tall content stays usable on mobile.
                    maxHeight: 'calc(100dvh - 16px)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    ...paperSx,
                  }}
                >
                  {title && (
                    <>
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexShrink: 0,

                          bgcolor: (theme) =>
                            alpha(theme.palette.text.primary, 0.04),
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: 'center',
                            ml: 2,
                            mr: 1,
                            my: 1,
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            component="div"
                            noWrap
                            sx={{
                              fontWeight: 800,
                            }}
                          >
                            {title}
                          </Typography>
                          {loading && (
                            <CircularProgress
                              size={16}
                              thickness={5}
                              aria-label={t('layerswitcher.loading')}
                            />
                          )}
                        </Stack>
                        {addition}
                      </Stack>
                      <Divider
                        sx={{
                          flexShrink: 0,
                          borderColor: (theme) =>
                            alpha(theme.palette.text.primary, 0.14),
                        }}
                      />
                    </>
                  )}
                  <Box sx={{ overflowY: 'auto', minHeight: 0 }}>{children}</Box>
                </Paper>
              </div>
            </ClickAwayListener>
          </div>
        </Fade>
      )}
    </StyledPopper>
  );
};
