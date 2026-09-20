import { NextPage } from 'next';
import { ClimbingAreasPanel } from '../src/components/ClimbingAreasPanel/ClimbingAreasPanel';
import { getClimbingListInitialProps } from '../src/components/ClimbingAreasPanel/ClimbingListPage';
import { ClimbingArea } from '../src/services/climbing-areas/getClimbingAreas';

type Props = {
  items: ClimbingArea[] | null;
};

const ViaFerratasPage: NextPage<Props> = ({ items }) => (
  <ClimbingAreasPanel items={items} listType="ferrata" />
);

ViaFerratasPage.getInitialProps = getClimbingListInitialProps('ferrata');

export default ViaFerratasPage;
