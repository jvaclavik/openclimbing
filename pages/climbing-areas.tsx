import { ClimbingAreasPanel } from '../src/components/ClimbingAreasPanel/ClimbingAreasPanel';
import { NextPage } from 'next';
import {
  ClimbingArea,
  getClimbingAreas,
} from '../src/services/climbing-areas/getClimbingAreas';
import { resolveCountryCode } from 'next-codegrid';

type Props = {
  climbingAreas: Array<ClimbingArea>;
};

const ClimbingAreasPage: NextPage<Props> = ({ climbingAreas }) => {
  return <ClimbingAreasPanel areas={climbingAreas} />;
};

ClimbingAreasPage.getInitialProps = async () => {
  const climbingAreas = await getClimbingAreas();

  await Promise.all(
    climbingAreas.map(async (area) => {
      if (area.center) {
        try {
          const code = await resolveCountryCode([
            area.center.lon,
            area.center.lat,
          ]);
          area.countryCode = code ?? undefined;
        } catch {
          // leave countryCode undefined
        }
      }
    }),
  );

  return {
    climbingAreas,
  };
};

export default ClimbingAreasPage;
