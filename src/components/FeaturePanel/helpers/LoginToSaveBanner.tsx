import styled from '@emotion/styled';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import { CircularProgress, IconButton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import { t } from '../../../services/intl';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';

const ACCENT = '#eb5757';
const ACCENT_HOVER = '#c2185b';

const Card = styled.div<{ $overlay?: boolean }>`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 14px 14px 14px 16px;
  border-radius: 18px;
  color: ${({ theme }) => theme.palette.text.primary};
  background: ${({ theme }) =>
    `linear-gradient(155deg, ${alpha(
      ACCENT,
      theme.palette.mode === 'dark' ? 0.38 : 0.22,
    )} 0%, ${alpha(ACCENT, theme.palette.mode === 'dark' ? 0.16 : 0.1)} 52%, transparent 100%), ${
      theme.palette.background.paper
    }`};
  border: 1px solid ${alpha(ACCENT, 0.34)};
  box-shadow:
    inset 0 1px 0
      ${({ theme }) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(255,255,255,0.75)'},
    0 10px 28px ${alpha(ACCENT, 0.18)};
  margin-bottom: ${({ $overlay }) => ($overlay ? 0 : 16)}px;
`;

const Glow = styled.div`
  position: absolute;
  right: -36px;
  top: -52px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${alpha(ACCENT, 0.55)} 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
`;

const Watermark = styled.div`
  position: absolute;
  right: -6px;
  bottom: -18px;
  color: ${ACCENT};
  opacity: 0.16;
  pointer-events: none;
  z-index: 0;
  transform: rotate(-12deg);
`;

const Close = styled(IconButton)`
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  color: inherit;
  opacity: 0.55;

  &:hover {
    opacity: 1;
  }
`;

const Row = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-right: 28px;
`;

const IconWrap = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: ${ACCENT};
  background: ${alpha(ACCENT, 0.2)};
  box-shadow: 0 0 0 1px ${alpha(ACCENT, 0.2)};
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const Cta = styled.button`
  appearance: none;
  font: inherit;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px 7px 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  background: ${ACCENT};
  box-shadow: 0 6px 16px ${alpha(ACCENT, 0.35)};
  transition: background 0.18s ease;

  &:hover,
  &:focus-visible {
    background: ${ACCENT_HOVER};
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`;

type LoginToSaveBannerProps = {
  overlay?: boolean;
};

export const LoginToSaveBanner = ({ overlay }: LoginToSaveBannerProps) => {
  const { loggedIn, handleLogin, loading } = useOsmAuthContext();
  const [dismissed, setDismissed] = useState(false);

  if (loggedIn || dismissed) return null;

  return (
    <Card $overlay={overlay}>
      <Glow />
      <Watermark>
        <LoginIcon sx={{ fontSize: overlay ? 92 : 108 }} />
      </Watermark>
      <Close
        size="small"
        aria-label={t('editdialog.login_banner_dismiss')}
        onClick={() => setDismissed(true)}
      >
        <CloseIcon fontSize="small" />
      </Close>
      <Row>
        <IconWrap>
          <LoginIcon />
        </IconWrap>
        <Body>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: -0.3,
            }}
          >
            {t('editdialog.login_banner_title')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 0.4,
              lineHeight: 1.45,
            }}
          >
            {t('editdialog.login_banner_body')}
          </Typography>
          <Cta type="button" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <>
                {t('featurepanel.login')}
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </>
            )}
          </Cta>
        </Body>
      </Row>
    </Card>
  );
};
