import Language from '@mui/icons-material/Language';
import LocalPhone from '@mui/icons-material/LocalPhone';
import { Chip } from '@mui/material';
import styled from '@emotion/styled';
import { PROJECT_ID } from '../../services/project';
import { FeaturedKeyRenderer } from '../../services/tagging/featuredKeys';
import { displayForm, protocol } from './renderers/helpers';
import { getUrlForTag } from './Properties/getUrlForTag';
import { getHumanValue } from './Properties/renderTag';
import { getFeaturedTagKeys } from './getFeaturedTagKeys';
import { useFeatureContext } from '../utils/FeatureContext';

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
    return <Language fontSize="small" />;
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

export const FeaturedLinkChips = () => {
  const { feature } = useFeatureContext();
  const items = getFeaturedTagKeys(feature).flatMap(({ k, v, featuredKey }) => {
    if (!isFeaturedLinkRenderer(featuredKey.renderer)) return [];
    if (
      featuredKey.renderer === 'WebsiteRenderer' &&
      PROJECT_ID === 'openclimbing' &&
      v.startsWith('https://openclimbing.org/')
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

  if (!items.length) return null;

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
    </ChipRow>
  );
};
