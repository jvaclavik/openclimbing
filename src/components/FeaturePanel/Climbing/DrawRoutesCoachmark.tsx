import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Button, Stack, Typography } from '@mui/material';
import { t } from '../../../services/intl';
import { useMobileMode } from '../../helpers';
import { PopperWithArrow } from '../../utils/PopperWithArrow';
import { usePersistedState } from '../../utils/usePersistedState';

const COACHMARK_STORAGE_KEY = 'climbing.drawRoutesCoachmarkSeen';

export const markDrawRoutesCoachmarkSeen = () => {
  try {
    window?.localStorage?.setItem(COACHMARK_STORAGE_KEY, 'true');
  } catch {
    // localStorage may be unavailable (private mode, SSR) — coachmark will
    // simply reappear next time, which is acceptable.
  }
};

const pulse = keyframes`
  0%   { transform: scale(1);   opacity: 1;   }
  70%  { transform: scale(1.6); opacity: 0;   }
  100% { transform: scale(1.6); opacity: 0;   }
`;

const IconBadge = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.palette.secondary.main};
  color: ${({ theme }) => theme.palette.secondary.contrastText};
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: ${({ theme }) => theme.palette.secondary.main};
    animation: ${pulse} 1.8s ease-out infinite;
    z-index: -1;
  }
`;

type Props = {
  anchorEl: HTMLElement | null;
  isVisible: boolean;
  onDismiss?: () => void;
};

export const DrawRoutesCoachmark = ({
  anchorEl,
  isVisible,
  onDismiss,
}: Props) => {
  const isMobileMode = useMobileMode();
  const [seen, setSeen] = usePersistedState<boolean>(
    COACHMARK_STORAGE_KEY,
    false,
  );

  const handleDismiss = () => {
    setSeen(true);
    onDismiss?.();
  };

  const open = isVisible && !seen && !isMobileMode && Boolean(anchorEl);

  return (
    <PopperWithArrow
      isOpen={open}
      anchorEl={anchorEl}
      placement="top-end"
      offset={[0, 14]}
      title={<span>{t('climbingpanel.coachmark_draw_routes_title')}</span>}
    >
      <Box paddingX={2} paddingY={1} maxWidth={300}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {t('climbingpanel.coachmark_draw_routes_body')}
        </Typography>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={handleDismiss}
          >
            {t('climbingpanel.coachmark_got_it')}
          </Button>
        </Stack>
      </Box>
    </PopperWithArrow>
  );
};
