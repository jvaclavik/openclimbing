import React from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Avatar, Box, Link as MuiLink, Stack, Typography } from '@mui/material';
import { t } from '../../services/intl';
import { PANEL_GAP } from '../utils/PanelHelpers';
import { OsmUserAvatarImg } from '../utils/OsmUserAvatarImg';
import { useOsmProfileAvatarUrl } from './useOsmProfileAvatarUrl';

const OSM_USER_BASE = 'https://www.openstreetmap.org/user';

function UserProfileHeroTitle({ titleName }: { titleName: string }) {
  return (
    <Typography
      variant="h5"
      component="h1"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        columnGap: 0.75,
        rowGap: 0.25,
      }}
    >
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
        {t('user_profile.title_prefix')}
      </Box>
      <MuiLink
        href={`${OSM_USER_BASE}/${encodeURIComponent(titleName)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('user_profile.osm_link_aria', { name: titleName })}
        underline="hover"
        sx={{
          fontWeight: 'inherit',
          color: 'primary.main',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.25,
          minWidth: 0,
        }}
      >
        <Box
          component="span"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {titleName}
        </Box>
        <OpenInNewIcon sx={{ fontSize: '0.85em', flexShrink: 0 }} aria-hidden />
      </MuiLink>
    </Typography>
  );
}

export const UserProfileHero = ({ titleName }: { titleName: string }) => {
  const initial = titleName.trim().charAt(0).toUpperCase() || '?';
  const { imageUrl } = useOsmProfileAvatarUrl(titleName);

  return (
    <Box sx={{ px: PANEL_GAP, pb: 0 }}>
      <Box
        sx={(theme) => ({
          mt: 1,
          mb: 2,
          p: 2.5,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(0,0,0,0.03) 100%)',
        })}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {imageUrl ? (
            <Box sx={{ flexShrink: 0, lineHeight: 0 }}>
              <OsmUserAvatarImg src={imageUrl} alt={titleName} $size={56} />
            </Box>
          ) : (
            <Avatar
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                typography: 'h6',
                bgcolor: 'primary.main',
              }}
            >
              {initial}
            </Avatar>
          )}
          <Stack spacing={0.5} flex={1} minWidth={0}>
            <UserProfileHeroTitle titleName={titleName} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};
