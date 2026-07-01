// Shared colour scale for accumulated precipitation [mm]. Used both by the
// server-side renderer (/api/precip-accum) and the on-screen legend so they
// always match. A pixel gets the colour of the highest stop whose `min` it
// reaches; below the first stop it stays transparent.
export type PrecipStop = {
  min: number; // mm threshold (inclusive)
  color: [number, number, number];
};

export const PRECIP_SCALE: PrecipStop[] = [
  { min: 0.1, color: [200, 230, 255] },
  { min: 1, color: [130, 200, 255] },
  { min: 5, color: [80, 150, 255] },
  { min: 10, color: [40, 90, 230] },
  { min: 20, color: [30, 170, 90] },
  { min: 30, color: [120, 210, 40] },
  { min: 40, color: [240, 230, 40] },
  { min: 60, color: [250, 170, 30] },
  { min: 80, color: [235, 90, 30] },
  { min: 100, color: [200, 30, 30] },
  { min: 150, color: [150, 20, 90] },
  { min: 250, color: [120, 60, 160] },
];

// Alpha applied to coloured (non-transparent) pixels in the rendered PNG.
export const PRECIP_ALPHA = 220;

export const precipColor = (mm: number): [number, number, number, number] => {
  if (!(mm >= PRECIP_SCALE[0].min)) {
    return [0, 0, 0, 0];
  }
  let c = PRECIP_SCALE[0].color;
  for (const stop of PRECIP_SCALE) {
    if (mm >= stop.min) {
      c = stop.color;
    }
  }
  return [c[0], c[1], c[2], PRECIP_ALPHA];
};
