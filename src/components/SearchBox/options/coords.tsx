import { Feature, LonLat } from '../../../services/types';
import { Setter } from '../../../types';
import { CoordsOption } from '../types';
import { IconPart, OptionBody, OptionSubtitle, OptionTitle } from '../utils';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import { getCoordsFeature } from '../../../services/getCoordsFeature';
import { t } from '../../../services/intl';
import { OpenLocationCode } from 'open-location-code';
import { getRoundedPosition, roundedToDeg } from '../../../utils';
import { getGlobalMap } from '../../../services/mapStorage';

const olc = new OpenLocationCode();

const COORDS_ZOOM = 17; // same as geocoder results, see fitBounds()

const olcDecoder = (inputValue: string): LonLat | null => {
  try {
    const { longitudeLo, latitudeLo } = olc.decode(inputValue);
    return [longitudeLo, latitudeLo];
  } catch {
    return null;
  }
};

// `47.32599, 15.38083` (used by theCrag or osm.org) as well as `47.32599° 15.38083°`
// anchored on both ends, so that a regular text query is never taken for coordinates
const regex =
  /^\s*(-?\d{1,3}(?:(?:\.|,)\d+)?)°?(?:\s|,|;)+(-?\d{1,3}(?:(?:\.|,)\d+)?)°?\s*$/;

const parseCoord = (value: string) => Number(value.replace(',', '.')); // decimal comma, eg. `47,32599`

const isValidCoord = ([lon, lat]: LonLat) => {
  const validLon = lon < 180 && lon > -180;
  const validLat = lat < 90 && lat > -90;
  return validLon && validLat;
};

export const getCoordsOption = (inputValue: string): CoordsOption[] => {
  const olcDecoded = olcDecoder(inputValue);
  if (olcDecoded) {
    return [
      {
        type: 'coords',
        coords: {
          center: olcDecoded,
          label: inputValue.trim().toUpperCase(),
          sublabel: 'OpenLocationCode',
        },
      },
    ];
  }
  const matches = inputValue.match(regex);
  if (!matches) {
    return [];
  }

  const [_, c1Str, c2Str] = matches;
  const c1 = parseCoord(c1Str);
  const c2 = parseCoord(c2Str);
  const coords = [[c2, c1] as LonLat, [c1, c2] as LonLat].filter((c) =>
    isValidCoord(c),
  );
  return coords.map((coord) => ({
    type: 'coords',
    coords: {
      center: coord,
      label: `${coord[1]}° ${coord[0]}°`,
      sublabel: t('searchbox.coordinate_subtitle'),
    },
  }));
};

export const coordsOptionsSelected = (
  { coords }: CoordsOption,
  setFeature: Setter<Feature>,
) => {
  const newFeature = getCoordsFeature([
    `${coords.center[0]}`,
    `${coords.center[1]}`,
  ]);
  setFeature(newFeature);
  getGlobalMap()?.flyTo({ center: coords.center, zoom: COORDS_ZOOM });
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
