import { ClimbingAreasPanel } from '../src/components/ClimbingAreasPanel/ClimbingAreasPanel';
import { NextPage, NextPageContext } from 'next';
import {
  ClimbingArea,
  getClimbingAreas,
} from '../src/services/climbing-areas/getClimbingAreas';

type Props = {
  climbingAreas: Array<ClimbingArea> | null;
};

const ClimbingAreasPage: NextPage<Props> = ({ climbingAreas }) => {
  return <ClimbingAreasPanel areas={climbingAreas} />;
};

ClimbingAreasPage.getInitialProps = async (ctx: NextPageContext) => {
  // Only fetch during SSR (direct visit / crawlers). On client-side navigation
  // we skip the slow Overpass query so the in-app transition is instant – the
  // panel then fetches the areas via react-query (cached) with a loading state.
  if (!ctx.req) {
    return { climbingAreas: null };
  }

  const climbingAreas = await getClimbingAreas();
  return { climbingAreas };
};

export default ClimbingAreasPage;
