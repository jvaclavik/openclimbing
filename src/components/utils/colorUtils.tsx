const parseHex = (hexCode: string) => {
  let hex = hexCode.replace('#', '');

  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
};

export const convertHexToRgba = (hexCode: string, opacity = 1) => {
  const { r, g, b } = parseHex(hexCode);

  return `rgba(${r},${g},${b},${opacity})`;
};

/** Mixes the color towards white, `ratio` 1 being pure white. */
export const tintHex = (hexCode: string, ratio: number) => {
  const { r, g, b } = parseHex(hexCode);
  const tint = (value: number) => Math.round(value + (255 - value) * ratio);

  return `rgb(${tint(r)},${tint(g)},${tint(b)})`;
};
