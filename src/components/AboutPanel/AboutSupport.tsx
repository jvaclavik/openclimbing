import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import CodeIcon from '@mui/icons-material/Code';
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin';
import FavoriteIcon from '@mui/icons-material/Favorite';
import IosShareIcon from '@mui/icons-material/IosShare';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import { useState } from 'react';
import { t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { useSnackbar } from '../utils/SnackbarContext';
import { BitcoinDialog } from '../HomepagePanel/BitcoinDialog';
import {
  DONATION_LINKS,
  GITHUB_REPO_URL,
} from '../HomepagePanel/donationLinks';

const FEEDBACK_EMAIL = 'jvaclavik@gmail.com';
const SHARE_URL = 'https://openclimbing.org';

const heartbeat = keyframes`
  0%, 20%, 100% { transform: scale(1); }
  5%, 15% { transform: scale(1.12); }
`;

const SupportCard = styled.div`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-top: 40px;
  margin-bottom: 24px;
  padding: 22px 18px 18px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(145deg, #ff4d6d 0%, #c2185b 48%, #6a1b9a 100%);
  box-shadow: 0 16px 40px ${alpha('#c2185b', 0.35)};
`;

const Glow = styled.div`
  position: absolute;
  right: -50px;
  top: -60px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${alpha('#fff', 0.28)} 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
`;

const Watermark = styled.div`
  position: absolute;
  right: -12px;
  bottom: -28px;
  color: #fff;
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
  transform: rotate(-12deg);
`;

const Heart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: ${alpha('#fff', 0.18)};
  box-shadow: 0 0 0 1px ${alpha('#fff', 0.2)};
  animation: ${heartbeat} 5s infinite;
`;

const WayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 18px;
`;

const wayTileCss = `
  appearance: none;
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 6px 10px;
  border-radius: 14px;
  cursor: pointer;
  text-decoration: none;
  color: #fff;
  background: ${alpha('#fff', 0.12)};
  border: 1px solid ${alpha('#fff', 0.2)};
  transition: background 0.15s ease;

  &:hover {
    background: ${alpha('#fff', 0.2)};
  }
`;

const WayButton = styled.button`
  ${wayTileCss}
`;

const WayLink = styled.a`
  ${wayTileCss}
`;

const WayCaption = styled.span`
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
`;

const DONATE_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 800,
  borderRadius: '999px',
  color: '#fff',
  borderColor: alpha('#fff', 0.45),
  '&:hover': {
    borderColor: '#fff',
    background: alpha('#fff', 0.12),
  },
} as const;

type Way = {
  key: 'share' | 'code' | 'feedback';
  icon: SvgIconComponent;
  label: TranslationId;
  href?: string;
  onClick?: () => void;
};

const WayTile = ({ way }: { way: Way }) => {
  const Icon = way.icon;
  const inner = (
    <>
      <Icon sx={{ fontSize: 22 }} />
      <WayCaption>{t(way.label)}</WayCaption>
    </>
  );

  if (way.href) {
    return (
      <WayLink
        href={way.href}
        target={way.href.startsWith('mailto:') ? undefined : '_blank'}
        rel="noopener noreferrer"
      >
        {inner}
      </WayLink>
    );
  }

  return (
    <WayButton type="button" onClick={way.onClick}>
      {inner}
    </WayButton>
  );
};

export const AboutSupport = () => {
  const [isBitcoinOpen, setIsBitcoinOpen] = useState(false);
  const { showToast } = useSnackbar();

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'OpenClimbing', url: SHARE_URL });
        return;
      }
    } catch {
      return;
    }
    await navigator.clipboard.writeText(SHARE_URL);
    showToast(t('sharedialog.copied'), 'success');
  };

  const ways: Way[] = [
    {
      key: 'share',
      icon: IosShareIcon,
      label: 'about.support_share',
      onClick: share,
    },
    {
      key: 'code',
      icon: CodeIcon,
      label: 'about.support_code',
      href: GITHUB_REPO_URL,
    },
    {
      key: 'feedback',
      icon: MailOutlineIcon,
      label: 'about.support_feedback',
      href: `mailto:${FEEDBACK_EMAIL}`,
    },
  ];

  return (
    <>
      <SupportCard>
        <Glow />
        <Watermark>
          <FavoriteIcon sx={{ fontSize: 160 }} />
        </Watermark>
        <Stack spacing={0} sx={{ position: 'relative', zIndex: 1 }}>
          <Heart>
            <FavoriteIcon sx={{ fontSize: 22 }} />
          </Heart>
          <Typography
            variant="h5"
            component="h2"
            fontWeight={800}
            letterSpacing={-0.4}
            lineHeight={1.2}
            mt={1.5}
          >
            {t('about.support_heading')}
          </Typography>
          <Typography
            variant="body2"
            mt={1}
            lineHeight={1.65}
            sx={{ opacity: 0.92 }}
          >
            {t('about.support_lead')}
          </Typography>
          <WayGrid>
            {ways.map((way) => (
              <WayTile key={way.key} way={way} />
            ))}
          </WayGrid>
          <Typography
            variant="caption"
            fontWeight={800}
            mt={2.5}
            mb={1}
            sx={{
              opacity: 0.8,
              letterSpacing: 0.08,
              textTransform: 'uppercase',
            }}
          >
            {t('about.support_donate')}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {DONATION_LINKS.map(({ label, href }) => (
              <Button
                key={label}
                size="small"
                variant="outlined"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={DONATE_BUTTON_SX}
              >
                {label}
              </Button>
            ))}
            <Button
              size="small"
              variant="outlined"
              startIcon={<CurrencyBitcoinIcon />}
              onClick={() => setIsBitcoinOpen(true)}
              sx={DONATE_BUTTON_SX}
            >
              Bitcoin
            </Button>
          </Stack>
          <Typography variant="body2" mt={2} sx={{ opacity: 0.8 }}>
            {t('support_us.thanks')}
          </Typography>
        </Stack>
      </SupportCard>
      <BitcoinDialog
        open={isBitcoinOpen}
        onClose={() => setIsBitcoinOpen(false)}
      />
    </>
  );
};
