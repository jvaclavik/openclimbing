import styled from '@emotion/styled';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useTheme } from '@mui/material';
import { useUserThemeContext } from '../../../helpers/theme';
import { getPoiClass } from '../../../services/getPoiClass';
import { FeatureTags } from '../../../services/types';
import { AreaIcon } from '../../FeaturePanel/Climbing/AreaIcon';
import { CragIcon } from '../../FeaturePanel/Climbing/CragIcon';
import { GymIcon } from '../../FeaturePanel/Climbing/GymIcon';
import { FerrataIcon } from '../../FeaturePanel/Climbing/FerrataIcon';
import { Maki } from './Maki';

// Shared accent used to highlight a route (its line is drawn on the active
// photo) across all surfaces — map dots, the route-number badge and this icon.
export const ROUTE_HIGHLIGHT_COLOR = '#4150a0';

const Container = styled.span<{ $highlighted?: boolean }>`
  margin-right: 6px;
  font-size: ${({ $highlighted }) => ($highlighted ? '19px' : '12px')};
  transition: font-size 0.15s ease;
`;

const ClimbingAreaIcon = (props: { size: number }) => {
  const theme = useTheme();
  return (
    <Container>
      <AreaIcon
        fill={theme.palette.text.secondary}
        stroke={theme.palette.text.secondary}
        height={props.size}
        width={props.size}
      />
    </Container>
  );
};

const ClimbingCragIcon = (props: { size: number }) => {
  const theme = useTheme();
  return (
    <Container>
      <CragIcon
        fill={theme.palette.text.secondary}
        stroke={theme.palette.text.secondary}
        height={props.size}
        width={props.size}
      />
    </Container>
  );
};

const GYM_ICON_SCALE = 0.7;

const ClimbingGymIcon = (props: { size: number }) => {
  const theme = useTheme();
  const height = props.size * GYM_ICON_SCALE;
  return (
    <Container>
      <GymIcon
        fill={theme.palette.text.secondary}
        stroke={theme.palette.text.secondary}
        height={height}
        width={(height * 39) / 22}
      />
    </Container>
  );
};

const ClimbingFerrataIcon = (props: { size: number }) => {
  const theme = useTheme();
  return (
    <Container>
      <FerrataIcon
        fill={theme.palette.text.secondary}
        stroke={theme.palette.text.secondary}
        height={props.size}
        width={(props.size * 29) / 36}
      />
    </Container>
  );
};

const ClimbingRouteIcon = ({ highlighted }: { highlighted?: boolean }) => (
  <Container $highlighted={highlighted}>
    <ShowChartIcon
      fontSize="inherit"
      color={highlighted ? undefined : 'secondary'}
      sx={highlighted ? { color: ROUTE_HIGHLIGHT_COLOR } : undefined}
    />
  </Container>
);

type Props = {
  ico?: string; // ico is supplied only in skeleton (until we have all tags) or point
  tags?: FeatureTags;
  size?: number;
  title?: string;
  middle?: boolean;
  themed?: boolean;
  /** Emphasize a climbing route icon (e.g. its line is drawn on the highlighted photo). */
  highlighted?: boolean;
};

export const PoiIcon = ({
  ico,
  tags,
  size = 12,
  title,
  middle,
  themed,
  highlighted,
}: Props) => {
  const { currentTheme } = useUserThemeContext();

  if (tags) {
    // TODO merge these icons with getPoiClass logic
    const isClimbingArea = tags.climbing === 'area';
    const isClimbingCrag = tags.climbing === 'crag';
    const isClimbingRoute = ['route_bottom', 'route'].includes(tags.climbing);
    const isClimbingGym = tags.climbing === 'gym';
    const isClimbingFerrata = tags.climbing === 'ferrata';

    if (isClimbingArea) return <ClimbingAreaIcon size={size} />;
    if (isClimbingCrag) return <ClimbingCragIcon size={size} />;
    if (isClimbingRoute) return <ClimbingRouteIcon highlighted={highlighted} />;
    if (isClimbingGym) return <ClimbingGymIcon size={size} />;
    if (isClimbingFerrata) return <ClimbingFerrataIcon size={size} />;
  }

  const finalIco = ico ? ico : getPoiClass(tags).class;

  return (
    <Maki
      ico={finalIco}
      size={highlighted ? size + 4 : size}
      style={{
        opacity: highlighted ? '1' : '0.3',
        position: 'relative',
        top: 3,
        transition: 'opacity 0.15s ease',
      }}
      title={title}
      middle={middle}
      themed={themed}
    />
  );
};
