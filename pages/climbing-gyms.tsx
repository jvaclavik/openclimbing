import { NextPage } from 'next';
import { ClimbingAreasPanel } from '../src/components/ClimbingAreasPanel/ClimbingAreasPanel';
import { getClimbingListInitialProps } from '../src/components/ClimbingAreasPanel/ClimbingListPage';
import { ClimbingArea } from '../src/services/climbing-areas/getClimbingAreas';

type Props = {
  items: ClimbingArea[] | null;
};

const ClimbingGymsPage: NextPage<Props> = ({ items }) => (
  <ClimbingAreasPanel items={items} listType="gym" />
);

ClimbingGymsPage.getInitialProps = getClimbingListInitialProps('gym');

export default ClimbingGymsPage;
