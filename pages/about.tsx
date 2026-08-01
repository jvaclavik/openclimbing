import { NextPage, NextPageContext } from 'next';
import { AboutPanel } from '../src/components/AboutPanel/AboutPanel';
import { getClimbingStats } from '../src/services/climbing-areas/getClimbingStats';
import type { ClimbingStatsResponse } from '../src/types';

type Props = {
  stats: ClimbingStatsResponse | null;
};

const AboutPage: NextPage<Props> = ({ stats }) => <AboutPanel stats={stats} />;

// Fetch only on SSR (direct visit / crawlers) so the numbers are in the HTML.
// On client-side navigation react-query fetches them (they are ~300 bytes).
AboutPage.getInitialProps = async (ctx: NextPageContext) => {
  if (!ctx.req) {
    return { stats: null };
  }

  const stats = await getClimbingStats();
  return { stats };
};

export default AboutPage;
