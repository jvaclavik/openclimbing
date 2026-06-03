import { Button, CircularProgress, Stack } from '@mui/material';
import { forwardRef, MouseEventHandler } from 'react';

type Props = {
  icon: React.FC<{ fontSize: 'small' }>;
  label: string;
  suffix?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  loading?: boolean;
};

export const QuickActionButton = forwardRef<HTMLButtonElement, Props>(
  ({ icon: Icon, label, suffix, onClick, loading }, ref) => (
    <Button
      ref={ref}
      onClick={onClick}
      color="secondary"
      variant="contained"
      disabled={loading}
      size="small"
      startIcon={
        loading ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          <Icon fontSize="small" />
        )
      }
    >
      {suffix ? (
        <Stack direction="row" alignItems="center" gap={0.5}>
          <span>{label}</span>
          {suffix}
        </Stack>
      ) : (
        label
      )}
    </Button>
  ),
);
QuickActionButton.displayName = 'QuickActionButton';
