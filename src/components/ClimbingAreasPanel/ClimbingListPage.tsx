import { NextPageContext } from 'next';
import {
  ClimbingArea,
  getClimbingAreas,
} from '../../services/climbing-areas/getClimbingAreas';
import type { ClimbingListType } from '../../services/climbing-areas/climbingListTypes';

type Props = {
  items: ClimbingArea[] | null;
};

export const getClimbingListInitialProps =
  (listType: ClimbingListType) =>
  async (ctx: NextPageContext): Promise<Props> => {
    // Only fetch during SSR (direct visit / crawlers). On client-side navigation
    // we skip the slow query so the in-app transition is instant – the panel
    // then fetches via react-query (cached) with a loading state.
    if (!ctx.req) {
      return { items: null };
    }
    return { items: await getClimbingAreas(listType) };
  };
