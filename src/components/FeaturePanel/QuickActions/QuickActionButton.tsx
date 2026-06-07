import { Chip, CircularProgress, Stack } from '@mui/material';
import { forwardRef, MouseEventHandler, ReactNode } from 'react';

type Props = {
  icon: React.FC<{ fontSize: 'small' }>;
  label: string;
  suffix?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  loading?: boolean;
};

export const QuickActionButton = forwardRef<HTMLButtonElement, Props>(
  ({ icon: Icon, label, suffix, onClick, loading }, ref) => (
    <Chip
      ref={ref}
      component="button"
      label={
        suffix ? (
          <Stack direction="row" alignItems="center" gap={0.5}>
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
