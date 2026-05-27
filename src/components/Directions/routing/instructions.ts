import ArrowUpward from '@mui/icons-material/ArrowUpward';
import FmdGood from '@mui/icons-material/FmdGood';
import RampLeft from '@mui/icons-material/RampLeft';
import RampRight from '@mui/icons-material/RampRight';
import RoundaboutLeft from '@mui/icons-material/RoundaboutLeft';
import SportsScore from '@mui/icons-material/SportsScore';
import TurnLeft from '@mui/icons-material/TurnLeft';
import TurnRight from '@mui/icons-material/TurnRight';
import TurnSharpRight from '@mui/icons-material/TurnSharpRight';
import TurnSlightLeft from '@mui/icons-material/TurnSlightLeft';
import TurnSlightRight from '@mui/icons-material/TurnSlightRight';
import UTurnLeft from '@mui/icons-material/UTurnLeft';
import UTurnRight from '@mui/icons-material/UTurnRight';
import QuestionMark from '@mui/icons-material/QuestionMark';
import TurnSharpLeft from '@mui/icons-material/TurnSharpLeft';

const GRAPH_HOPPER_INSTRUCTION_CODES = {
  [-3]: 'sharp left',
  [-2]: 'left',
  [-1]: 'slight left',
  0: 'straight',
  1: 'slight right',
  2: 'right',
  3: 'sharp right',
  4: 'finish reached',
  5: 'via reached',
  6: 'roundabout',
  [-7]: 'keep left',
  7: 'keep right',
  [-98]: 'unknown direction u-turn',
  [-8]: 'left u-turn',
  8: 'right u-turn',
};

export type Sign = keyof typeof GRAPH_HOPPER_INSTRUCTION_CODES;

export const icon = (sign: Sign) => {
  switch (sign) {
    case -3:
      return TurnSharpLeft;
    case -2:
      return TurnLeft;
    case -1:
      return TurnSlightLeft;
    case 0:
      return ArrowUpward;
    case 1:
      return TurnSlightRight;
    case 2:
      return TurnRight;
    case 3:
      return TurnSharpRight;
    case 4:
      return SportsScore;
    case 5:
      return FmdGood;
    case 6:
      return RoundaboutLeft;
    case -7:
      return RampLeft;
    case 7:
      return RampRight;
    case -98:
    case -8:
      return UTurnLeft;
    case 8:
      return UTurnRight;
    default:
      return QuestionMark;
  }
};
