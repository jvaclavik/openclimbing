import { addProtocol, setWorkerUrl } from 'maplibre-gl';
import { CUZK_DEM_PROTOCOL, cuzkDemLoader } from './Terrain3d/cuzkDem';

if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
  addProtocol(CUZK_DEM_PROTOCOL, cuzkDemLoader);
}
