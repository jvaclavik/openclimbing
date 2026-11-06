import { Chip, CircularProgress, Stack } from '@mui/material';
import { forwardRef, MouseEventHandler, ReactNode } from 'react';

type Props = {
  icon: React.FC<{ fontSize: 'small' }>;
  label: string;
  suffix?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  loading?: boolean;
  pressed?: boolean;
};

export const QuickActionButton = forwardRef<HTMLButtonElement, Props>(
  ({ icon: Icon, label, suffix, onClick, loading, pressed }, ref) => (
    <Chip
      ref={ref}
      component="button"
      aria-pressed={pressed}
      label={
        suffix ? (
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <span>{label}</span>
            {suffix}
          </Stack>
        ) : (
          label
        )
      }
      icon={
        loading ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          <Icon fontSize="small" />
        )
      }
      onClick={onClick}
      disabled={loading}
    />
  ),
);
QuickActionButton.displayName = 'QuickActionButton';
