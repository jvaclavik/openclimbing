import React, { useMemo } from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { t } from '../../services/intl';
import { PANEL_GAP } from '../utils/PanelHelpers';
import { OsmUserAvatarImg } from '../utils/OsmUserAvatarImg';
import { useOsmProfileAvatarUrl } from './useOsmProfileAvatarUrl';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { ClimbingTick } from '../../types';
import { computeUserProfileSummary } from './userProfileSummary';
import { UserProfileHeroActions } from './UserProfileHeroActions';

const AVATAR_SIZE = 60;

const HeroAvatar = ({ titleName }: { titleName: string }) => {
  const { imageUrl } = useOsmProfileAvatarUrl(titleName);
  if (imageUrl) {
    return (
      <Box sx={{ flexShrink: 0, lineHeight: 0 }}>
        <OsmUserAvatarImg src={imageUrl} alt={titleName} $size={AVATAR_SIZE} />
      </Box>
    );
  }
  return (
    <Avatar
      sx={(theme) => ({
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        flexShrink: 0,
        bgcolor: 'primary.main',
        fontFamily: theme.typography.h1.fontFamily,
        fontWeight: 900,
        fontSize: 26,
      })}
    >
      {titleName.trim().charAt(0).toUpperCase() || '?'}
    </Avatar>
  );
};

const useHeroMeta = (fetchedTicks: FetchedClimbingTick[]) =>
  useMemo(() => {
    const { sinceYear, homeArea } = computeUserProfileSummary(fetchedTicks);
    return [
      sinceYear ? t('user_profile.climbing_since', { year: sinceYear }) : null,
      homeArea,
    ]
      .filter(Boolean)
      .join(' · ');
  }, [fetchedTicks]);

export const UserProfileHero = ({
  titleName,
  fetchedTicks = [],
  rawTicks = [],
}: {
  titleName: string;
  fetchedTicks?: FetchedClimbingTick[];
  rawTicks?: ClimbingTick[];
}) => {
  const meta = useHeroMeta(fetchedTicks);

  return (
    <Box sx={{ px: PANEL_GAP, mt: 2.5, mb: 2 }}>
      <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center' }}>
        <HeroAvatar titleName={titleName} />
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: 26,
              fontWeight: 900,
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            {titleName}
          </Typography>
          {meta ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {meta}
            </Typography>
          ) : null}
        </Stack>
        {/* Keep clear of the floating close button (top: 8px, right: 8px). */}
        <Stack direction="row" sx={{ mr: 6 }}>
          <UserProfileHeroActions displayName={titleName} rawTicks={rawTicks} />
        </Stack>
      </Stack>
    </Box>
  );
};
