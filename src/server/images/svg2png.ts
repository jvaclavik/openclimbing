// https://canvg.js.org/examples/nodejs
import { DOMParser } from '@xmldom/xmldom';
import canvas from 'canvas';
import fetch from 'isomorphic-unfetch';
import { Canvg, presets } from 'canvg';

const preset = presets.node({ DOMParser, canvas, fetch });

type Size = { width: number; height: number };

const DEFAULT_SIZE: Size = { width: 800, height: 600 };

export const svg2png = async (
  svg: string,
  size: Size = DEFAULT_SIZE,
): Promise<Buffer> => {
  const picture = preset.createCanvas(size.width, size.height);
  const ctx = picture.getContext('2d');
  const v = Canvg.fromString(ctx, svg, preset);
  await v.render(); // Render only first frame, ignoring animations.

  return picture.toBuffer();
};
