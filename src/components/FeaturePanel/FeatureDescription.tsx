import styled from '@emotion/styled';
import { Box, Button, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { OSM_WEBSITE } from '../../services/osm/consts';
import { t, Translation } from '../../services/intl';
import { Feature, OsmType, TranslationId } from '../../services/types';
import { getOsmappLink, prod } from '../../services/helpers';
import { tint } from '../utils/panelUi';
import { useFeatureContext } from '../utils/FeatureContext';

const OSM_TYPE_KEY: Record<OsmType, TranslationId> = {
  node: 'osmtype.node',
  way: 'osmtype.way',
  relation: 'osmtype.relation',
};

const OSM_TYPE_DESCRIPTION: Record<OsmType, TranslationId> = {
  node: 'osmtype.node.description',
  way: 'osmtype.way.description',
  relation: 'osmtype.relation.description',
};

const OsmBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 10px;
  background: ${({ theme }) => tint(theme, 0.06)};
`;

const A = ({ href, children }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    children
  );

const getUrls = ({ type, id, changeset, user }: Feature['osmMeta']) => ({
  itemUrl: `${OSM_WEBSITE}/${type}/${id}`,
  changesetUrl: changeset && `${OSM_WEBSITE}/changeset/${changeset}`,
  userUrl: user && `${OSM_WEBSITE}/user/${user}`,
  idUrl: `${OSM_WEBSITE}/edit?${type}=${id}`,
});

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 14px;
  margin-top: 10px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.text.secondary};

  a {
    color: inherit;
    font-weight: 600;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
`;

const Urls = () => {
  const { osmMeta } = useFeatureContext().feature;
  const { timestamp, type, id, user, version } = osmMeta;
  const { itemUrl, changesetUrl, userUrl, idUrl } = getUrls(osmMeta);
  const date = timestamp?.split('T')[0];

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        href={itemUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ mt: 1.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {type}/{id}
      </Button>
      {(version != null || date || user) && (
        <Meta>
          {version != null && <A href={idUrl}>v{version}</A>}
          {date && <A href={changesetUrl}>{date}</A>}
          {user && <A href={userUrl}>{user}</A>}
        </Meta>
      )}
    </>
  );
};

export const OpenInProduction = () => {
  const { feature } = useFeatureContext();
  const uri = getOsmappLink(feature);
  const osmappUrl = `https://osmapp.org${uri}`;
  const openclimbingUrl = `https://openclimbing.org${uri}`;
  if (prod) {
    return null;
  }

  return (
    <Typography variant="caption" component="div">
      Open in prod: <A href={osmappUrl}>osmapp</A> •{' '}
      <A href={openclimbingUrl}>openclimbing</A>
    </Typography>
  );
};

export const FromOsm = () => (
  <>
    <Typography variant="body2" color="text.secondary" lineHeight={1.65}>
      <Translation id="homepage.about_osm" />
    </Typography>
    <Urls />
  </>
);

export const FeatureDescription = () => {
  const { osmMeta, nonOsmObject, point } = useFeatureContext().feature;
  const { type, id } = osmMeta;

  if (point) {
    return <>{t('featurepanel.feature_description_point')}</>;
  }

  if (nonOsmObject) {
    return <>{t('featurepanel.feature_description_nonosm', { type })}</>;
  }

  const typeLabel = t(OSM_TYPE_KEY[type]);

  return (
    <Stack direction="row" gap={1.25} alignItems="center" minWidth={0}>
      <Tooltip
        title={
          <>
            {typeLabel}
            <br />
            {t(OSM_TYPE_DESCRIPTION[type])}
          </>
        }
      >
        <OsmBadge>
          <img src="/logo-osm.svg" alt="" width={18} height={18} />
        </OsmBadge>
      </Tooltip>
      <Box minWidth={0}>
        <Typography variant="body2" fontWeight={700} lineHeight={1.2} noWrap>
          OpenStreetMap
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          lineHeight={1.35}
          noWrap
        >
          {typeLabel} · {id}
        </Typography>
      </Box>
    </Stack>
  );
};
