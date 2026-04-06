import { FeatureTags, OsmId } from '../types';
import { TickStyle } from '../../components/FeaturePanel/Climbing/types';
import { ClimbingTick } from '../../types';
import { TickScore } from './tickScoring';

export type FetchedClimbingTick = {
  key: string;
  name: string;
  grade: string;
  center?: number[];
  index: number;
  date: string;
  style: TickStyle;
  apiId: OsmId;
  tags: FeatureTags;
  tick: ClimbingTick;
  tickScore: TickScore;
};
