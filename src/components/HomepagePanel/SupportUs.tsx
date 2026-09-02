import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { t, Translation } from '../../services/intl';
import { BitcoinDialog } from './BitcoinDialog';
import { DONATION_LINKS, GITHUB_REPO_URL } from './donationLinks';
import { CardRow, CardTitle, LinkCard } from './LinkCard';

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

export const SupportUs = () => {
  const [isBitcoinDialogOpen, setIsBitcoinDialogOpen] = useState(false);

  return (
    <Box
      sx={{
        mt: 2,
      }}
    >
      <LinkCard>
        <CardRow>
          <CardTitle icon={<Heart>❤️</Heart>}>
            {t('support_us.title')}
          </CardTitle>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 1,
            }}
          >
            {t('support_us.p1')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
            }}
          >
            {t('support_us.p2')}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
            }}
          >
            {t('support_us.how_to_help')}
          </Typography>
          <HelpList>
            <li>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {t('support_us.share')}
              </Typography>
            </li>
            <li>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                <a href="mailto:jvaclavik@gmail.com">
                  {t('support_us.feedback')}
                </a>
              </Typography>
            </li>
            <li>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {t('support_us.add_content')}
              </Typography>
            </li>
            <li>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                <Translation
                  id="support_us.develop"
                  tags={{
                    link: `a href="${GITHUB_REPO_URL}" target="_blank"`,
                  }}
                />
              </Typography>
            </li>
          </HelpList>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              mb: 1,
            }}
          >
            {t('support_us.contribute_financially')}
          </Typography>
          <Stack
            direction="row"
            sx={{
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
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

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 2,
            }}
          >
            {t('support_us.thanks')}
          </Typography>
        </CardRow>
      </LinkCard>

      <BitcoinDialog
        open={isBitcoinDialogOpen}
        onClose={() => setIsBitcoinDialogOpen(false)}
      />
    </Box>
  );
};
