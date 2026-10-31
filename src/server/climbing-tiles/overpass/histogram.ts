import { getDifficulty } from '../../../services/tagging/climbing/routeGrade';
import { GRADE_TABLE } from '../../../services/tagging/climbing/gradeData';
import { GeojsonFeature } from './types';

// The histogram is a list of (gradeIndex, routeCount) pairs. Each entry starts
// with the grade index in one byte, followed by the count:
// - grade indices are < 128 (GRADE_TABLE has ~94 rows), so the top bit of the
//   index byte is free and is used as a flag for a multi-byte count
// - a count up to 255 is stored in a single byte (same layout as before)
// - a count over 255 is stored as an unsigned LEB128 varint, so only these
//   rare entries (large areas like Frankenjura) take more than two bytes
const CONTINUATION = 0x80;
const MAX_INDEX = 0x7f;

const writeVarint = (out: number[], value: number) => {
  let rest = value;
  while (rest >= CONTINUATION) {
    out.push(rest % CONTINUATION | CONTINUATION);
    rest = Math.floor(rest / CONTINUATION);
  }
  out.push(rest);
};

const readVarint = (view: DataView, offset: number) => {
  let value = 0;
  let multiplier = 1;
  let position = offset;
  for (;;) {
    const byte = view.getUint8(position);
    position += 1;
    value += (byte % CONTINUATION) * multiplier;
    if (byte < CONTINUATION) {
      return { value, offset: position };
    }
    multiplier *= CONTINUATION;
  }
};

export const encodeHistogram = (array: number[] | undefined): string | null => {
  if (!array) {
    return null;
  }
  if (array.length > MAX_INDEX + 1) {
    throw new Error(`Index exceeds 7-bit max value (${MAX_INDEX})`);
  }

  const bytes: number[] = [];
  for (let i = 0; i < array.length; i++) {
    const count = array[i];
    if (!(count > 0)) {
      continue;
    }
    if (count <= 0xff) {
      bytes.push(i, count);
    } else {
      bytes.push(i | CONTINUATION);
      writeVarint(bytes, count);
    }
  }

  return Buffer.from(bytes).toString('base64');
};

export const decodeHistogram = (base64String: string): number[] => {
  const originalArrayLength = GRADE_TABLE.uiaa.length;

  const buf = Buffer.from(base64String, 'base64');
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const resultArray: number[] = new Array(originalArrayLength).fill(0);

  let offset = 0;
  while (offset < view.byteLength) {
    const header = view.getUint8(offset);
    offset += 1;
    const index = header & MAX_INDEX;

    let value: number;
    if (header & CONTINUATION) {
      const read = readVarint(view, offset);
      value = read.value;
      offset = read.offset;
    } else {
      value = view.getUint8(offset);
      offset += 1;
    }

    if (index >= originalArrayLength) continue;
    resultArray[index] = value;
  }
  return resultArray;
};

export const getHistogram = (cragMembers: GeojsonFeature[]) => {
  const result: number[] = [];
  for (const route of cragMembers) {
    if (!route) continue;

    const grade = getDifficulty(route.tags);
    if (!grade) continue;

    const table = GRADE_TABLE[grade.gradeSystem];
    if (!table) continue;

    const index = table.indexOf(grade.grade);
    result[index] = (result[index] ?? 0) + 1;
  }

  return result;
};

export const sumMemberHistograms = (members: GeojsonFeature[]) => {
  const histograms = members
    .map((member) => member?.properties.histogram)
    .filter(Boolean);

  const result: number[] = [];
  for (const histogram of histograms) {
    histogram.forEach((value, index) => {
      result[index] = (result[index] ?? 0) + value;
    });
  }
  return result;
};
