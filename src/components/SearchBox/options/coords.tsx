import { Feature, LonLat } from '../../../services/types';
import { Setter } from '../../../types';
import { CoordsOption } from '../types';
import { IconPart, OptionBody, OptionSubtitle, OptionTitle } from '../utils';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { getCoordsFeature } from '../../../services/getCoordsFeature';
import { t } from '../../../services/intl';
import {
  getRoundedPosition,
  positionToDeg,
  roundedToDeg,
} from '../../../utils';
import { getGlobalMap } from '../../../services/mapStorage';
import { parseCoords } from './parseCoords';

const COORDS_ZOOM = 17; // same as geocoder results, see fitBounds()

export const getCoordsOption = (inputValue: string): CoordsOption[] =>
  parseCoords(inputValue).map(({ center, format }) => ({
    type: 'coords',
    coords: {
      center,
      label: positionToDeg(center),
      sublabel:
        format === 'degrees' ? t('searchbox.coordinate_subtitle') : format,
    },
  }));

export const coordsOptionsSelected = (
  { coords }: CoordsOption,
  setFeature: Setter<Feature>,
) => {
  // rounded the same way as a click on the map, otherwise a converted DMS/OLC/MGRS
  // coordinate shows up as eg. `49.816720833333335°` in the panel
  const newFeature = getCoordsFeature(
    getRoundedPosition(coords.center, COORDS_ZOOM),
  );
  setFeature(newFeature);
  getGlobalMap()?.flyTo({ center: newFeature.center, zoom: COORDS_ZOOM });
};

type Props = {
  option: CoordsOption;
};

export const CoordsRow = ({ option: { coords } }: Props) => (
  <>
    <IconPart>
      <TravelExploreIcon />
    </IconPart>
    <OptionBody>
      <OptionTitle>{coords.label}</OptionTitle>
      <OptionSubtitle>{coords.sublabel}</OptionSubtitle>
    </OptionBody>
  </>
);

export const getDirectionsCoordsOption = (
  center: LonLat,
  label?: string,
): CoordsOption => ({
  type: 'coords',
  coords: {
    center,
    label:
      label ||
      roundedToDeg(getRoundedPosition(center, getGlobalMap().getZoom())),
    sublabel: label || t('searchbox.coordinate_subtitle'),
  },
});
