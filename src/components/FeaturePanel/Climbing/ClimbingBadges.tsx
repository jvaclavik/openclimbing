import styled from '@emotion/styled';
import ChildFriendlyIcon from '@mui/icons-material/ChildFriendly';
import ExploreIcon from '@mui/icons-material/Explore';
import TerrainIcon from '@mui/icons-material/Terrain';
import { Chip, Stack, Tooltip } from '@mui/material';
import React from 'react';
import { t } from '../../../services/intl';
import { getClimbingRockTranslationKey } from '../../../services/tagging/climbing/climbingRockData';
import { CLIMBING_START_OPTIONS } from '../../../services/tagging/climbing/climbingAttributes';
import { Feature, TranslationId } from '../../../services/types';
import { useFeatureContext } from '../../utils/FeatureContext';

const StyledChip = styled(Chip)`
  font-size: 10px;
  font-weight: 600;
  height: 14px;
  padding: 0;
  > span {
    padding: 4px;
  }
`;

const climbingTypes = {
  boulder: {
    value: 'climbing:boulder',
    label: 'climbing_badges.boulder_label',
    description: 'climbing_badges.boulder_description',
  },
  trad: {
    value: 'climbing:trad',
    label: 'climbing_badges.trad_label',
    description: 'climbing_badges.trad_description',
  },
  speed: {
    value: 'climbing:speed',
    label: 'climbing_badges.speed_label',
    description: 'climbing_badges.speed_description',
  },
  sport: {
    value: 'climbing:sport',
    label: 'climbing_badges.sport_label',
    description: 'climbing_badges.sport_description',
  },
  multipitch: {
    value: 'climbing:multipitch',
    label: 'climbing_badges.multipitch_label',
    description: 'climbing_badges.multipitch_description',
  },
  ice: {
    value: 'climbing:ice',
    label: 'climbing_badges.ice_label',
    description: 'climbing_badges.ice_description',
  },
  mixed: {
    value: 'climbing:mixed',
    label: 'climbing_badges.mixed_label',
    description: 'climbing_badges.mixed_description',
  },
  deepwater: {
    value: 'climbing:deepwater',
    label: 'climbing_badges.deepwater_label',
    description: 'climbing_badges.deepwater_description',
  },
  toprope: {
    value: 'climbing:toprope',
    label: 'climbing_badges.toprope_label',
    description: 'climbing_badges.toprope_description',
  },
} as const;

const climbingHazards = {
  loose_rock: {
    value: 'climbing:hazard:loose_rock',
    label: 'climbing_badges.hazard_loose_rock_label',
    description: 'climbing_badges.hazard_loose_rock_description',
  },
  rockfall_zone: {
    value: 'climbing:hazard:rockfall_zone',
    label: 'climbing_badges.hazard_rockfall_zone_label',
    description: 'climbing_badges.hazard_rockfall_zone_description',
  },
  wet: {
    value: 'climbing:hazard:wet',
    label: 'climbing_badges.hazard_wet_label',
    description: 'climbing_badges.hazard_wet_description',
  },
  vegetation: {
    value: 'climbing:hazard:vegetation',
    label: 'climbing_badges.hazard_vegetation_label',
    description: 'climbing_badges.hazard_vegetation_description',
  },
  unstable_anchor: {
    value: 'climbing:hazard:unstable_anchor',
    label: 'climbing_badges.hazard_unstable_anchor_label',
    description: 'climbing_badges.hazard_unstable_anchor_description',
  },
  missing_anchor: {
    value: 'climbing:hazard:missing_anchor',
    label: 'climbing_badges.hazard_missing_anchor_label',
    description: 'climbing_badges.hazard_missing_anchor_description',
  },
  animal_nest: {
    value: 'climbing:hazard:animal_nest',
    label: 'climbing_badges.hazard_animal_nest_label',
    description: 'climbing_badges.hazard_animal_nest_description',
  },
  death_fall_zone: {
    value: 'climbing:hazard:death_fall_zone',
    label: 'climbing_badges.hazard_death_fall_zone_label',
    description: 'climbing_badges.hazard_death_fall_zone_description',
  },
  first_bolt_high: {
    value: 'climbing:hazard:first_bolt_high',
    label: 'climbing_badges.hazard_first_bolt_high_label',
    description: 'climbing_badges.hazard_first_bolt_high_description',
  },
  long_runout: {
    value: 'climbing:hazard:long_runout',
    label: 'climbing_badges.hazard_long_runout_label',
    description: 'climbing_badges.hazard_long_runout_description',
  },
  bad_protection: {
    value: 'climbing:hazard:bad_protection',
    label: 'climbing_badges.hazard_bad_protection_label',
    description: 'climbing_badges.hazard_bad_protection_description',
  },
  dirty_rock: {
    value: 'climbing:hazard:dirty_rock',
    label: 'climbing_badges.hazard_dirty_rock_label',
    description: 'climbing_badges.hazard_dirty_rock_description',
  },
  slippery_rock: {
    value: 'climbing:hazard:slippery_rock',
    label: 'climbing_badges.hazard_slippery_rock_label',
    description: 'climbing_badges.hazard_slippery_rock_description',
  },
} as const;

const otherTags = {
  family_friendly: {
    value: 'climbing:family_friendly',
    label: 'climbing_badges.family_friendly_label',
    description: 'climbing_badges.family_friendly_description',
    icon: ChildFriendlyIcon,
  },
} as const;

const renderTitle = (
  label: TranslationId,
  tagValue: string,
  Icon?: React.ElementType,
) => {
  return (
    <Stack
      direction="row"
      sx={{
        gap: 0.4,
        alignItems: 'center',
      }}
    >
      {Icon && <Icon fontSize="inherit" />}
      <span>
        {t(label)}
        {tagValue !== 'yes' ? ` (${tagValue})` : ''}
      </span>
    </Stack>
  );
};

type Props = {
  feature: Feature;
  hasTooltip?: boolean;
  dense?: boolean;
  subtle?: boolean;
};

const collectRockMaterials = (feature: Feature): string[] => {
  const rocks = new Set<string>();
  const walk = (f: Feature) => {
    const rock = f.tags?.['climbing:rock']?.trim();
    if (rock) {
      rocks.add(rock);
    }
    f.memberFeatures?.forEach(walk);
  };
  walk(feature);
  return [...rocks];
};

const MaterialBadges = ({ feature }: { feature: Feature }) => {
  const materials = collectRockMaterials(feature);
  if (!materials.length) {
    return null;
  }

  return (
    <>
      {materials.map((material) => {
        const translationKey = getClimbingRockTranslationKey(material);
        return (
          <StyledChip
            key={material}
            label={
              <Stack
                direction="row"
                sx={{
                  gap: 0.4,
                  alignItems: 'center',
                }}
              >
                <TerrainIcon fontSize="inherit" />
                <span>
                  {translationKey
                    ? t(translationKey as TranslationId)
                    : material}
                </span>
              </Stack>
            }
            size="small"
            color="success"
          />
        );
      })}
    </>
  );
};

// Which way the rock faces decides when the sun hits it – one of the first
// things a climber checks, so it belongs next to the rock type.
const ORIENTATION_LABELS: Record<string, TranslationId> = {
  N: 'climbing_orientation.n',
  NE: 'climbing_orientation.ne',
  E: 'climbing_orientation.e',
  SE: 'climbing_orientation.se',
  S: 'climbing_orientation.s',
  SW: 'climbing_orientation.sw',
  W: 'climbing_orientation.w',
  NW: 'climbing_orientation.nw',
};

const OrientationBadge = ({ feature }: { feature: Feature }) => {
  const orientation = feature.tags?.['climbing:orientation'];
  const label = ORIENTATION_LABELS[orientation?.toUpperCase()];
  if (!label) return null;

  return (
    <Tooltip title={t('climbing_orientation.label')} arrow>
      <StyledChip
        label={renderTitle(label, 'yes', ExploreIcon)}
        size="small"
        color="warning"
      />
    </Tooltip>
  );
};

const StartBadge = ({ feature }: { feature: Feature }) => {
  const start = feature.tags?.['climbing:start'];
  if (!start) return null;

  const translationItem = CLIMBING_START_OPTIONS.find(
    ({ value }) => value === start,
  );
  const startLabel = translationItem?.translationKey
    ? t(translationItem.translationKey)
    : start;

  return <StyledChip label={startLabel} size="small" color="info" />;
};

export const ClimbingBadges = ({
  feature,
  hasTooltip,
  dense,
  subtle,
}: Props) => {
  return (
    <Stack
      direction="row"
      useFlexGap
      sx={[
        {
          gap: 0.5,
          flexWrap: 'wrap',
          paddingBottom: dense ? 0 : 2,
        },
        subtle ? { opacity: 0.6 } : undefined,
      ]}
    >
      {Object.entries(climbingTypes).map(
        ([_key, { value, label, description }]) =>
          feature.tags?.[value] === 'yes' ? (
            <Tooltip key={value} title={hasTooltip ? t(description) : ''} arrow>
              <StyledChip
                label={t(label)}
                size="small"
                color="primary"
                variant="filled"
              />
            </Tooltip>
          ) : null,
      )}

      {Object.entries(climbingHazards).map(
        ([_key, { value, label, description }]) => {
          const tagValue = feature.tags?.[value];
          return tagValue !== 'no' && tagValue !== undefined ? (
            <Tooltip key={value} title={hasTooltip ? t(description) : ''} arrow>
              <StyledChip
                label={renderTitle(label, tagValue)}
                size="small"
                color="error"
              />
            </Tooltip>
          ) : null;
        },
      )}
      {Object.entries(otherTags).map(
        ([_key, { value, label, description, icon }]) => {
          const tagValue = feature.tags?.[value];
          return tagValue !== 'no' && tagValue !== undefined ? (
            <Tooltip key={value} title={hasTooltip ? t(description) : ''} arrow>
              <StyledChip
                label={renderTitle(label, tagValue, icon)}
                size="small"
                color="success"
              />
            </Tooltip>
          ) : null;
        },
      )}
      <StartBadge feature={feature} />
      <MaterialBadges feature={feature} />
      <OrientationBadge feature={feature} />
    </Stack>
  );
};

export const PanelClimbingBadges = () => {
  const { feature } = useFeatureContext();
  if (!feature.tags.climbing) {
    return null;
  }

  return <ClimbingBadges feature={feature} hasTooltip />;
};
