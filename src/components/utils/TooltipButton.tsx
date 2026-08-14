import React, { useEffect, useRef } from 'react';
import { Box, IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { isMobileDevice, useBoolState } from '../helpers';

const useClickAwayListener = (
  tooltipRef: React.MutableRefObject<HTMLDivElement>,
  hide: () => void,
  isMobile: boolean,
) => {
  useEffect(() => {
    const clickAway = (e: MouseEvent) => {
      if (e.target instanceof Node && !tooltipRef.current.contains(e.target)) {
        hide();
      }
    };

    if (isMobile) {
      window.addEventListener('click', clickAway);
    }

    return () => {
      if (isMobile) {
        window.removeEventListener('click', clickAway);
      }
    };
  }, [hide, isMobile, tooltipRef]);
};

type Props = {
  tooltip: React.ReactNode;
  sx?: SxProps<Theme>;
  children?: React.ReactNode;
  enterDelay?: number;
  enterNextDelay?: number;
};

/**
 * Desktop: tooltip on hover. Mobile: tooltip on tap (MUI hover tooltips
 * don't work on touch). Optional children replace the default info icon.
 */
export const TooltipButton = ({
  tooltip,
  sx,
  children,
  enterDelay,
  enterNextDelay,
}: Props) => {
  const isMobile = isMobileDevice();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mobileTooltipShown, show, hide] = useBoolState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      e.preventDefault();
      show();
    }
  };

  useClickAwayListener(tooltipRef, hide, isMobile);

  const trigger = children ? (
    <Box
      component="span"
      onClick={handleClick}
      sx={{ display: 'inline-flex', lineHeight: 0, cursor: 'help' }}
    >
      {children}
    </Box>
  ) : (
    <IconButton onClick={handleClick} sx={sx} aria-label="info button">
      <InfoOutlinedIcon fontSize="inherit" color="inherit" />
    </IconButton>
  );

  // There is a bug in MUI, passing `open={undefined}` prop to Tooltip makes it uninteractive TODO check again eg 6/2025, or report
  return isMobile ? (
    <Tooltip
      arrow
      title={tooltip}
      placement="top"
      open={mobileTooltipShown}
      ref={tooltipRef}
    >
      {trigger}
    </Tooltip>
  ) : (
    <Tooltip
      arrow
      title={tooltip}
      placement="top"
      enterDelay={enterDelay}
      enterNextDelay={enterNextDelay}
      ref={tooltipRef}
    >
      {trigger}
    </Tooltip>
  );
};
