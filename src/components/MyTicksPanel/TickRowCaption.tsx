import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import { t } from '../../services/intl';
import { PartnersMentionsText } from '../FeaturePanel/Climbing/PartnersMentionsText';

/**
 * Secondary lines under a tick title (diary, route detail, mentions):
 * [personal best ·] [crag ·] partners, then the note for other climbers.
 */
export const TickRowCaption = ({
  personalBest = false,
  cragName = null,
  partners = '',
  note = null,
}: {
  personalBest?: boolean;
  cragName?: string | null;
  partners?: string;
  note?: string | null;
}) => {
  const hasPartners = partners.trim() !== '';
  const noteText = note?.trim();
  const hasMeta = personalBest || !!cragName || hasPartners;
  if (!hasMeta && !noteText) return null;

  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      {hasMeta ? (
        <Typography
          variant="caption"
          component="div"
          sx={{ color: 'text.secondary', lineHeight: 1.35 }}
        >
          {personalBest ? (
            <Box
              component="span"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {t('my_ticks.personal_best')}
              {cragName || hasPartners ? ' · ' : null}
            </Box>
          ) : null}
          {cragName}
          {cragName && hasPartners ? ' · ' : null}
          {hasPartners ? (
            <PartnersMentionsText text={partners} variant="caption" />
          ) : null}
        </Typography>
      ) : null}
      {noteText ? (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ alignItems: 'flex-start', color: 'text.secondary' }}
          title={t('tick.note_label')}
        >
          <StickyNote2OutlinedIcon
            sx={{ fontSize: 14, mt: '2px', flexShrink: 0 }}
            aria-label={t('tick.note_label')}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.primary',
              opacity: 0.8,
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
              overflowWrap: 'anywhere',
            }}
          >
            {noteText}
          </Typography>
        </Stack>
      ) : null}
    </Stack>
  );
};
