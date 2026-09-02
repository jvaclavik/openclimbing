import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { isMobileDevice } from '../helpers';

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
 *
 * Always controlled (`open` is a boolean) so SSR vs client hydration
 * cannot switch the Tooltip between uncontrolled and controlled.
 */
export const TooltipButton = ({
  tooltip,
  sx,
  children,
  enterDelay,
  enterNextDelay,
}: Props) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isMobileDevice()) return undefined;

    const clickAway = (e: MouseEvent) => {
      if (e.target instanceof Node && !tooltipRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', clickAway);
    return () => window.removeEventListener('click', clickAway);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobileDevice()) {
      e.preventDefault();
      setOpen(true);
    }
  };

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

  return (
    <Tooltip
      arrow
      title={tooltip}
      placement="top"
      open={open}
      onOpen={() => {
        if (!isMobileDevice()) setOpen(true);
      }}
      onClose={() => {
        if (!isMobileDevice()) setOpen(false);
      }}
      enterDelay={enterDelay}
      enterNextDelay={enterNextDelay}
      ref={tooltipRef}
    >
      {trigger}
    </Tooltip>
  );
};
