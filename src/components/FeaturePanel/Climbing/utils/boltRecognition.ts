// Local, in-browser bolt recognition using the openclimbing-bolts-ai YOLO model.
// The heavy ONNX runtime and the model itself are loaded lazily on first use,
// so nothing is downloaded until the user clicks "Recognize bolts".
// See https://github.com/zbycz/openclimbing-bolts-ai

const ORT_URL =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js';
const ORT_WASM_PATH =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/';
const MODEL_URL =
  'https://zbycz.github.io/openclimbing-bolts-ai/models/openclimbing-bolts-v1.onnx';

const TILE = 1024;
const OVERLAP = 0.2;
const CONF = 0.25; // confidence threshold
const IOU = 0.45; // non-maximum-suppression threshold

export type BoltDetection = {
  cx: number; // center x, 0..1 of image width
  cy: number; // center y, 0..1 of image height
  w: number;
  h: number;
  score: number;
};

const getOrt = (): any => (window as any).ort;

let ortPromise: Promise<void> | null = null;
let sessionPromise: Promise<any> | null = null;

const loadOrt = (): Promise<void> => {
  if (getOrt()) return Promise.resolve();
  if (!ortPromise) {
    ortPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ORT_URL;
      script.onload = () => resolve();
      script.onerror = () => {
        ortPromise = null;
        reject(new Error('Failed to load ONNX runtime'));
      };
      document.head.appendChild(script);
    });
  }
  return ortPromise;
};

const loadSession = async () => {
  await loadOrt();
  const ort = getOrt();
  if (!sessionPromise) {
    ort.env.wasm.wasmPaths = ORT_WASM_PATH;
    // Single-threaded: multi-threaded wasm needs SharedArrayBuffer, which
    // requires cross-origin isolation (COOP/COEP headers) the app doesn't set,
    // so threading would throw. The model is small, single thread is plenty.
    ort.env.wasm.numThreads = 1;
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
    });
  }
  return sessionPromise;
};

// Wikimedia serves images with permissive CORS headers, so a fresh
// crossOrigin image lets us read its pixels without tainting the canvas.
const loadCorsImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('Failed to load image for recognition'));
    image.src = src;
  });

const tilePositions = (size: number): number[] => {
  const stride = Math.round(TILE * (1 - OVERLAP));
  if (size <= TILE) return [0];
  const pos: number[] = [];
  for (let p = 0; p <= size - TILE; p += stride) pos.push(p);
  if (pos[pos.length - 1] !== size - TILE) pos.push(size - TILE);
  return pos;
};

const iou = (a: BoltDetection, b: BoltDetection) => {
  const ix = Math.max(
    0,
    Math.min(a.cx + a.w / 2, b.cx + b.w / 2) -
      Math.max(a.cx - a.w / 2, b.cx - b.w / 2),
  );
  const iy = Math.max(
    0,
    Math.min(a.cy + a.h / 2, b.cy + b.h / 2) -
      Math.max(a.cy - a.h / 2, b.cy - b.h / 2),
  );
  const inter = ix * iy;
  return inter / (a.w * a.h + b.w * b.h - inter);
};

const nms = (boxes: BoltDetection[]): BoltDetection[] => {
  const sorted = boxes.slice().sort((a, b) => b.score - a.score);
  const keep: BoltDetection[] = [];
  const used = new Uint8Array(sorted.length);
  for (let i = 0; i < sorted.length; i += 1) {
    if (used[i]) continue;
    keep.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (!used[j] && iou(sorted[i], sorted[j]) > IOU) used[j] = 1;
    }
  }
  return keep;
};

const tileTensor = (
  img: HTMLImageElement,
  tx: number,
  ty: number,
  tw: number,
  th: number,
): Float32Array => {
  const off = document.createElement('canvas');
  off.width = TILE;
  off.height = TILE;
  const oc = off.getContext('2d');
  oc.fillStyle = '#808080';
  oc.fillRect(0, 0, TILE, TILE);
  oc.drawImage(img, tx, ty, tw, th, 0, 0, tw, th);
  const d = oc.getImageData(0, 0, TILE, TILE).data;
  const n = TILE * TILE;
  const t = new Float32Array(3 * n);
  for (let i = 0; i < n; i += 1) {
    t[i] = d[i * 4] / 255;
    t[n + i] = d[i * 4 + 1] / 255;
    t[2 * n + i] = d[i * 4 + 2] / 255;
  }
  return t;
};

/**
 * Runs the bolt-detection model on the given image src (in 1024px tiles) and
 * returns detected bolt centers in percentage (0..1) coordinates.
 *
 * `onProgress(done, total)` is called once the tile count is known (0/total)
 * and after every tile, so the caller can show determinate progress. Before
 * that — while the runtime and model are still downloading — it isn't called,
 * so the caller can show an indeterminate spinner.
 */
export const recognizeBolts = async (
  src: string,
  onProgress?: (done: number, total: number) => void,
): Promise<BoltDetection[]> => {
  const sess = await loadSession();
  const ort = getOrt();
  const img = await loadCorsImage(src);

  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const xs = tilePositions(W);
  const ys = tilePositions(H);
  const inName = sess.inputNames[0];
  const raw: BoltDetection[] = [];

  const total = xs.length * ys.length;
  let done = 0;
  onProgress?.(done, total);

  for (const ty of ys) {
    for (const tx of xs) {
      const tw = Math.min(TILE, W - tx);
      const th = Math.min(TILE, H - ty);
      const tensor = tileTensor(img, tx, ty, tw, th);
      const inp = new ort.Tensor('float32', tensor, [1, 3, TILE, TILE]);
      // eslint-disable-next-line no-await-in-loop
      const out = await sess.run({ [inName]: inp });
      const od = out[sess.outputNames[0]];
      const data = od.data;
      const na = od.dims[2]; // number of anchors
      for (let i = 0; i < na; i += 1) {
        const s = data[4 * na + i];
        if (s < CONF) continue;
        if (data[0 * na + i] > tw || data[1 * na + i] > th) continue;
        raw.push({
          cx: (tx + data[0 * na + i]) / W,
          cy: (ty + data[1 * na + i]) / H,
          w: data[2 * na + i] / W,
          h: data[3 * na + i] / H,
          score: s,
        });
      }
      done += 1;
      onProgress?.(done, total);
      // Yield to the event loop so the UI (spinner) stays responsive.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  return nms(raw);
};
