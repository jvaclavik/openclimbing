import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useUserThemeContext } from '../../helpers/theme';
import { t } from '../../services/intl';
import { CardRow, CardTitle, LinkCard } from './LinkCard';

// Dvojitý úder (“lub-dub”) + pauza, v 1s cyklu (což odpovídá cca 60 BPM).
const heartbeat = keyframes`
  0% {
    transform: scale(1);
  }
  5% {
    transform: scale(1.1);
  }
  10% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.1);
  }
  20% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
`;

const Heart = styled.div`
  animation: ${heartbeat} 5s infinite;
`;

const HelpList = styled.ul`
  margin: 4px 0 16px;
  padding-left: 20px;

  li {
    margin-bottom: 4px;
  }
`;

const Qr = styled.img<{ $isDark: boolean }>`
  ${({ $isDark }) => $isDark && `filter: invert(1);`}
`;

const DONATION_LINKS = [
  { label: 'Github sponsor', href: 'https://github.com/sponsors/jvaclavik' },
  {
    label: 'Buy me a coffee',
    href: 'https://buymeacoffee.com/openclimbing.org',
  },
  { label: 'Revolut', href: 'https://revolut.me/jvaclavik' },
];

// This function doesn't contain any logic - so no extraction needed.
// eslint-disable-next-line max-lines-per-function
export const SupportUs = () => {
  const [isBitcoinDialogOpen, setIsBitcoinDialogOpen] = useState(false);
  const { currentTheme } = useUserThemeContext();
  const isDark = currentTheme === 'dark';

  const onClose = () => {
    setIsBitcoinDialogOpen(false);
  };

  return (
    <Box mt={2}>
      <LinkCard>
        <CardRow>
          <CardTitle icon={<Heart>❤️</Heart>}>
            {t('support_us.title')}
          </CardTitle>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {t('support_us.p1')}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {t('support_us.p2')}
          </Typography>

          <Typography variant="body2" fontWeight={700}>
            {t('support_us.how_to_help')}
          </Typography>
          <HelpList>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('support_us.share')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <a href="mailto:jvaclavik@gmail.com">
                  {t('support_us.feedback')}
                </a>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('support_us.add_content')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('support_us.develop')}
              </Typography>
            </li>
          </HelpList>

          <Typography variant="body2" fontWeight={700} mb={1}>
            {t('support_us.contribute_financially')}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => setIsBitcoinDialogOpen(true)}
            >
              Bitcoin
            </Button>
            {DONATION_LINKS.map(({ label, href }) => (
              <Button
                key={label}
                size="small"
                variant="outlined"
                color="inherit"
                href={href}
                target="_blank"
              >
                {label}
              </Button>
            ))}
          </Stack>

          <Typography variant="body2" color="text.secondary" mt={2}>
            {t('support_us.thanks')}
          </Typography>
        </CardRow>
      </LinkCard>

      <Dialog open={isBitcoinDialogOpen} onClose={onClose}>
        <AppBar position="static" color="transparent">
          <Toolbar>
            <Typography noWrap variant="h6" component="div">
              {t('support_us.bitcoin_dialog_title')}
            </Typography>

            <Tooltip title="Close crag detail">
              <IconButton color="primary" edge="end" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <DialogContent dividers>
          <Qr src="/openclimbing/btcln.png" $isDark={isDark} />
          <Typography variant="body1">openclimbing@lnbits.cz</Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
