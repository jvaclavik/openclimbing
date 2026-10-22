import styled from '@emotion/styled';
import Language from '@mui/icons-material/Language';
import LocalPhone from '@mui/icons-material/LocalPhone';
import Search from '@mui/icons-material/Search';
import { Chip, SvgIcon } from '@mui/material';
import { WikipediaIcon } from '../../assets/WikipediaIcon';
import { t } from '../../services/intl';
import { FeaturedKeyRenderer } from '../../services/tagging/featuredKeys';
import { Feature } from '../../services/types';
import { useFeatureContext } from '../utils/FeatureContext';
import { getUrlForTag } from './Properties/getUrlForTag';
import { getHumanValue } from './Properties/renderTag';
import { getFeaturedTagKeys } from './getFeaturedTagKeys';
import {
  climbingGoogleSearch,
  isOpenClimbingSelfLink,
} from './helpers/climbingGoogleSearch';
import { displayForm, protocol } from './renderers/helpers';

const LINK_RENDERERS: FeaturedKeyRenderer[] = [
  'WebsiteRenderer',
  'PhoneRenderer',
  'WikipediaRenderer',
  'WikidataRenderer',
];

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  a,
  a:hover,
  a:focus {
    text-decoration: none !important;
  }
`;

const chipSx = {
  maxWidth: '100%',
  textDecoration: 'none',
  '&:hover, &:focus': {
    textDecoration: 'none',
  },
} as const;

const iconForRenderer = (renderer: FeaturedKeyRenderer) => {
  if (renderer === 'WebsiteRenderer') return <Language fontSize="small" />;
  if (renderer === 'PhoneRenderer') return <LocalPhone fontSize="small" />;
  if (renderer === 'WikipediaRenderer' || renderer === 'WikidataRenderer') {
    return (
      <SvgIcon component={WikipediaIcon} inheritViewBox fontSize="small" />
    );
  }
  return undefined;
};

const hrefForTag = (renderer: FeaturedKeyRenderer, k: string, v: string) => {
  if (renderer === 'PhoneRenderer') {
    return `tel:${v.split(';')[0].replace(/\s+/g, '')}`;
  }
  if (renderer === 'WebsiteRenderer') {
    return v.match(protocol) ? v : `http://${v}`;
  }
  return getUrlForTag(k, v);
};

export const isFeaturedLinkRenderer = (renderer: FeaturedKeyRenderer) =>
  LINK_RENDERERS.includes(renderer);

export const hasVisibleLinkChips = (feature: Feature) =>
  getFeaturedTagKeys(feature).some(({ featuredKey }) =>
    isFeaturedLinkRenderer(featuredKey.renderer),
  ) || climbingGoogleSearch(feature) != null;

export const FeaturedLinkChips = () => {
  const { feature } = useFeatureContext();
  const items = getFeaturedTagKeys(feature).flatMap(({ k, v, featuredKey }) => {
    if (!isFeaturedLinkRenderer(featuredKey.renderer)) return [];
    if (
      featuredKey.renderer === 'WebsiteRenderer' &&
      isOpenClimbingSelfLink(v)
    ) {
      return [];
    }

    const href = hrefForTag(featuredKey.renderer, k, v);
    const label =
      featuredKey.renderer === 'WebsiteRenderer'
        ? displayForm(v)
        : getHumanValue(k, v);

    return [
      { key: k, href, label, icon: iconForRenderer(featuredKey.renderer) },
    ];
  });

  const googleSearch = climbingGoogleSearch(feature);
  if (!items.length && !googleSearch) return null;

  return (
    <ChipRow>
      {items.map((item) =>
        item.href ? (
          <Chip
            key={item.key}
            component="a"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            size="small"
            icon={item.icon}
            label={item.label}
            sx={chipSx}
          />
        ) : (
          <Chip
            key={item.key}
            size="small"
            icon={item.icon}
            label={item.label}
            sx={chipSx}
          />
        ),
      )}
      {googleSearch ? (
        <Chip
          component="a"
          href={googleSearch.href}
          target="_blank"
          rel="noopener noreferrer"
          clickable
          size="small"
          icon={<Search fontSize="small" />}
          label={t('featurepanel.search_on_google')}
          title={googleSearch.query}
          sx={chipSx}
        />
      ) : null}
    </ChipRow>
  );
};
