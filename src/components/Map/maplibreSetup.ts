import { setWorkerUrl } from 'maplibre-gl';

if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
}
