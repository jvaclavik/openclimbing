import { FeatureTags, OsmId } from '../types';
import { TickStyle } from '../../components/FeaturePanel/Climbing/types';
import { ClimbingTick } from '../../types';
import { TickScore } from './tickScoring';

export type FetchedClimbingTick = {
  key: string;
  name: string;
  grade: string;
  /** Oblast / skála z DB (parent cesty), pokud je v datech. */
  areaName: string | null;
  center?: number[];
  index: number;
  date: string;
  style: TickStyle;
  apiId: OsmId;
  tags: FeatureTags;
  tick: ClimbingTick;
  tickScore: TickScore;
};
