import type { SvgIconComponent } from '@mui/icons-material';
import RadarIcon from '@mui/icons-material/Radar';
import type { MapControlId } from '../mapControlsRegistry';
import type { OverlayIds, OverlayProductKey } from './radarLayer';

export type PrecipProduct = {
  key: OverlayProductKey;
  controlId: Extract<MapControlId, 'radar'>;
  ids: OverlayIds;
  color: string;
  icon: SvgIconComponent;
  buttonTooltip: string;
  popperTitle: string;
  loadingText: string;
  emptyText: string;
  enableHint: string;
  footer: string;
  stepMinutes: number; // publishing step, drives the "−X min" caption
  latestLabel: string;
  defaultOpacity: number;
};

export const RADAR_PRODUCT: PrecipProduct = {
  key: 'maxz',
  controlId: 'radar',
  ids: { sourceId: 'chmu-radar', layerId: 'chmu-radar-layer' },
  color: '#f5a623',
  icon: RadarIcon,
  buttonTooltip: 'Srážkový radar (ČHMÚ)',
  popperTitle: 'Radar',
  loadingText: 'Načítám radarová data…',
  emptyText: 'Radarová data se nepodařilo načíst.',
  enableHint: 'Zapni radar přepínačem vpravo nahoře.',
  footer: 'Data © ČHMÚ · pokrytí Česko a okolí',
  stepMinutes: 5,
  latestLabel: 'poslední snímek',
  defaultOpacity: 0.75,
};
