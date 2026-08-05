import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import React from 'react';
import { t } from '../../../services/intl';
import { OverpassFeature } from '../../../services/overpass/overpassSearch';
import { GRADE_TABLE } from '../../../services/tagging/climbing/gradeData';
import {
  getGradeSystemName,
  GradeSystem,
} from '../../../services/tagging/climbing/gradeSystems';
import {
  convertGrade,
  getDifficulty,
  getDifficultyColor,
  getGradeRange,
} from '../../../services/tagging/climbing/routeGrade';
import { Feature } from '../../../services/types';
import { isClimbingCrag } from '../../../utils';
import { convertHexToRgba } from '../../utils/colorUtils';
import { useFeatureContext } from '../../utils/FeatureContext';
import { CONTENT_GAP } from '../../utils/PanelHelpers';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { ContentContainer } from './ContentContainer';
import { GradeSystemSelect } from './GradeSystemSelect';
import { PanelLabel } from './PanelLabel';
import { RouteDifficultyBadge } from './RouteDifficultyBadge';

const MAX_COLUMN_HEIGHT = 40;
const NUMBER_OF_ROUTES_HEIGHT = 14;
const MAX_CHART_HEIGHT = MAX_COLUMN_HEIGHT + NUMBER_OF_ROUTES_HEIGHT;

// past this many columns the labels stop fitting side by side and have to turn
const HORIZONTAL_LABEL_LIMIT = 12;

const getGroupingLabel = (
  label: string,
  gradeSystem: GradeSystem,
  isGrouped: boolean,
) => {
  if (isGrouped === false) return label;

  if (gradeSystem === 'saxon') {
    const match = label?.match(/^[A-Z]+/);
    return match ? match[0] : '';
  }
  if (gradeSystem === 'polish') {
    const match = label?.match(/^[A-Z]+\.?[0-9]?/);
    return match ? match[0] : '';
  }
  if (gradeSystem === 'hueco') {
    const match = label?.match(/^[A-Z0-9]+/);
    return match ? match[0] : '';
  }
  if (gradeSystem === 'yds_class') {
    const match = label?.match(/^[0-9]\.[0-9]+/);
    return match ? match[0] : '';
  }
  return String(parseFloat(label));
};

type GradeSpan = { min: string; max: string };

/** `span` is the stretch of the grade table the bucket stands for – a column
 *  labelled `5` can cover anything from `4+/5-` to `5+`. */
type Bucket = { grade: string; count: number; span: GradeSpan };

// One entry per grade (or grade group), in table order, zeroes included – the
// gaps are what makes the shape of a crag readable.
const getBuckets = (
  features: Array<Feature | OverpassFeature>,
  gradeSystem: GradeSystem,
  isGrouped: boolean,
): Bucket[] => {
  const counts = new Map<string, number>();
  const spans = new Map<string, GradeSpan>();
  for (const grade of GRADE_TABLE[gradeSystem] ?? []) {
    const label = getGroupingLabel(grade, gradeSystem, isGrouped);
    if (spans.has(label)) {
      spans.get(label).max = grade;
    } else {
      counts.set(label, 0);
      spans.set(label, { min: grade, max: grade });
    }
  }

  for (const feature of features) {
    const difficulty = getDifficulty(feature.tags);
    if (!difficulty) {
      continue;
    }
    const converted = convertGrade(
      difficulty.gradeSystem,
      gradeSystem,
      difficulty.grade,
    );
    const label = getGroupingLabel(converted, gradeSystem, isGrouped);
    if (counts.has(label)) {
      counts.set(label, counts.get(label) + 1);
    }
  }

  return [...counts.entries()].map(([grade, count]) => ({
    grade,
    count,
    span: spans.get(grade),
  }));
};

const trimEmptyEdges = (buckets: Bucket[]) => {
  const first = buckets.findIndex(({ count }) => count > 0);
  if (first === -1) {
    return buckets;
  }
  const last = buckets.reduce(
    (acc, { count }, index) => (count > 0 ? index : acc),
    first,
  );
  return buckets.slice(first, last + 1);
};

const formatGrade = (grade: string) =>
  grade === 'NaN' || !grade ? '?' : grade;

const useBucketColor = () => {
  const theme = useTheme();
  const { gradeSystem } = useUserSettingsContext();
  return (grade: string) =>
    getDifficultyColor({ gradeSystem, grade }, theme.palette.mode);
};

// ------------------------------------------------------------------- tooltip

const TooltipTitle = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
`;

const TooltipCount = styled.span`
  font-size: 13px;
  font-weight: 700;
`;

const TooltipGrades = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
`;

const BucketTooltip = ({
  count,
  span,
  children,
}: Omit<Bucket, 'grade'> & { children: React.ReactElement }) => {
  const { gradeSystem } = useUserSettingsContext();

  return (
    <Tooltip
      arrow
      enterDelay={400}
      title={
        <TooltipTitle>
          <TooltipCount>{count}×</TooltipCount>
          <TooltipGrades>
            <RouteDifficultyBadge
              routeDifficulty={{ gradeSystem, grade: span.min }}
            />
            {span.min !== span.max && (
              <>
                –
                <RouteDifficultyBadge
                  routeDifficulty={{ gradeSystem, grade: span.max }}
                />
              </>
            )}
          </TooltipGrades>
        </TooltipTitle>
      }
    >
      {children}
    </Tooltip>
  );
};

// ---------------------------------------------------------------- full chart

const Container = styled.div`
  margin: 4px 0px 0px;

  padding: 0 ${CONTENT_GAP} 8px;
  overflow: auto;
`;

const Items = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
`;

const NumberOfRoutes = styled.div`
  font-size: 9px;
  line-height: ${NUMBER_OF_ROUTES_HEIGHT}px;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

// Capped so a crag spanning three grades doesn't turn into three slabs, but
// wide enough that the bars fill their column instead of floating in it.
const Column = styled.div`
  flex: 1 1 0;
  min-width: 12px;
  max-width: 56px;
  gap: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const GraphItems = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  flex: 1;
  min-width: 0;
`;

const GradeSystemName = styled.div`
  color: ${({ theme }) => theme.palette.secondary.main};
  font-size: 12px;
  display: flex;
  justify-content: flex-end;
`;

const DifficultyLevel = styled.div<{
  $isActive: boolean;
  $color: string;
  $rotated: boolean;
}>`
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ $color, $isActive, theme }) =>
    $isActive ? $color : convertHexToRgba(theme.palette.secondary.main, 0.6)};
  font-weight: ${({ $isActive }) => ($isActive ? 'bold' : 'normal')};
  font-size: ${({ $rotated }) => ($rotated ? 9 : 10)}px;
  ${({ $rotated }) => $rotated && `transform: rotateZ(270deg);`}
`;

const StaticHeightContainer = styled.div`
  width: 100%;
  height: ${MAX_CHART_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-direction: column;
`;

const EMPTY_BAR_HEIGHT = 2;

const Bar = styled.div<{ $ratio: number; $color: string }>`
  width: 100%;
  // empty grades keep a stub so the gaps read as a baseline, and a lone route
  // in a big crag would otherwise round down to nothing
  height: ${({ $ratio }) =>
    $ratio === 0
      ? EMPTY_BAR_HEIGHT
      : Math.max(3, MAX_COLUMN_HEIGHT * $ratio)}px;
  background-color: ${({ $color, $ratio, theme }) =>
    $ratio === 0
      ? convertHexToRgba(theme.palette.secondary.main, 0.25)
      : $color};
  // browsers clamp the radius on short bars, so stubs stay proportionate
  border-radius: 5px 5px 2px 2px;
`;

const FullChart = ({
  buckets,
  maxCount,
}: {
  buckets: Bucket[];
  maxCount: number;
}) => {
  const getColor = useBucketColor();
  // once the columns get this dense there is no room for horizontal labels nor
  // for the counts – the tooltips carry them instead
  const isDense = buckets.length > HORIZONTAL_LABEL_LIMIT;

  return (
    <GraphItems>
      {buckets.map(({ grade, count, span }) => {
        const color = getColor(grade);
        return (
          <BucketTooltip key={grade} count={count} span={span}>
            <Column>
              <StaticHeightContainer>
                {count > 0 && !isDense && (
                  <NumberOfRoutes>{count}×</NumberOfRoutes>
                )}
                <Bar $color={color} $ratio={count / maxCount} />
              </StaticHeightContainer>
              <DifficultyLevel
                $color={color}
                $isActive={count > 0}
                $rotated={isDense}
              >
                {formatGrade(grade)}
              </DifficultyLevel>
            </Column>
          </BucketTooltip>
        );
      })}
    </GraphItems>
  );
};

// -------------------------------------------------------------- compact form

const CompactRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px ${CONTENT_GAP} 0;
`;

const COMPACT_BAR_HEIGHT = 6;

const CompactTrack = styled.div`
  display: flex;
  flex: 1;
  gap: 3px;
  height: ${COMPACT_BAR_HEIGHT}px;
`;

// Only the two ends of the spectrum are rounded – the cuts between grades stay
// square, so the segments read as slices of one bar. Longhand radii on purpose:
// with a single grade both rules apply and round the whole pill.
const CompactSegment = styled.div<{ $count: number; $color: string }>`
  flex: ${({ $count }) => $count} 1 0;
  min-width: ${COMPACT_BAR_HEIGHT}px;
  background-color: ${({ $color }) => $color};

  &:first-of-type {
    border-top-left-radius: ${COMPACT_BAR_HEIGHT / 2}px;
    border-bottom-left-radius: ${COMPACT_BAR_HEIGHT / 2}px;
  }

  &:last-of-type {
    border-top-right-radius: ${COMPACT_BAR_HEIGHT / 2}px;
    border-bottom-right-radius: ${COMPACT_BAR_HEIGHT / 2}px;
  }
`;

const EdgeGrade = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
`;

// The whole spread on a single line: segment widths carry the counts, the two
// ends carry the exact range. Repeated once per crag, so height is everything.
const CompactChart = ({
  buckets,
  range,
}: {
  buckets: Bucket[];
  range: { min: string; max: string } | null;
}) => {
  const getColor = useBucketColor();
  const filled = buckets.filter(({ count }) => count > 0);

  return (
    <CompactRow>
      {range && <EdgeGrade $color={getColor(range.min)}>{range.min}</EdgeGrade>}
      <CompactTrack>
        {filled.map(({ grade, count, span }) => (
          <BucketTooltip key={grade} count={count} span={span}>
            <CompactSegment $count={count} $color={getColor(grade)} />
          </BucketTooltip>
        ))}
      </CompactTrack>
      {range && range.max !== range.min && (
        <EdgeGrade $color={getColor(range.max)}>{range.max}</EdgeGrade>
      )}
    </CompactRow>
  );
};

// ------------------------------------------------------------------- heading

const DistributionLabel = () => (
  <PanelLabel addition={<GradeSystemSelect size="tiny" />}>
    {t('featurepanel.grade_range')}
  </PanelLabel>
);

// -------------------------------------------------------------------- public

type GradePicker = 'inline' | 'label' | 'none';

type Props = {
  features: Array<Feature | OverpassFeature>;
  isGrouped?: boolean;
  /** `label` moves the grade-system picker into a heading with the grade range,
   *  `none` drops it – charts repeated per crag would show a row of pickers */
  gradePicker?: GradePicker;
  /** `compact` collapses the chart into a single-line spectrum */
  variant?: 'full' | 'compact';
};

export const RouteDistribution = ({
  features,
  isGrouped = true,
  gradePicker = 'inline',
  variant = 'full',
}: Props) => {
  const { gradeSystem } = useUserSettingsContext();

  if (!features?.length) {
    return null;
  }

  const allBuckets = getBuckets(features, gradeSystem, isGrouped);

  // Grades nobody climbs here say nothing, so the axis starts at the easiest
  // route and ends at the hardest. Gaps in between stay – they are the shape.
  const buckets = trimEmptyEdges(allBuckets);
  const maxCount = Math.max(...buckets.map(({ count }) => count), 0);
  if (maxCount === 0) {
    return null;
  }

  // checked before the fallback below – a card has no room for a stray heading
  if (variant === 'compact') {
    const range = getGradeRange(
      features.map(({ tags }) => tags),
      gradeSystem,
    );
    return <CompactChart buckets={buckets} range={range} />;
  }

  // the untrimmed count, so a crag with a single grade still gets its chart
  if (allBuckets.length < 2) {
    return (
      <PanelLabel addition={<GradeSystemSelect />}>
        {t('grade_system_select.convert_grade')}
      </PanelLabel>
    );
  }

  return (
    <>
      {gradePicker === 'label' && <DistributionLabel />}
      <Container>
        <ContentContainer>
          <Items>
            <FullChart buckets={buckets} maxCount={maxCount} />
            {gradePicker === 'inline' && (
              <GradeSystemName>
                <Tooltip
                  title={t('routedistribution.grade_system_description', {
                    gradeSystemName: getGradeSystemName(gradeSystem),
                  })}
                >
                  <GradeSystemSelect size="tiny" />
                </Tooltip>
              </GradeSystemName>
            )}
          </Items>
        </ContentContainer>
      </Container>
    </>
  );
};

export const RouteDistributionInFeaturePanel = () => {
  const { feature } = useFeatureContext();
  if (!feature) return null;

  return (
    isClimbingCrag(feature) && (
      <RouteDistribution
        features={feature.memberFeatures}
        gradePicker="label"
      />
    )
  );
};
