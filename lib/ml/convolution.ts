/**
 * 3×3 convolution helpers for CV lesson demos (pure TS).
 */

export type Kernel3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export const PRESET_KERNELS: Record<
  string,
  { kernel: Kernel3; label: { "zh-CN": string; en: string } }
> = {
  identity: {
    kernel: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    label: { "zh-CN": "恒等", en: "Identity" },
  },
  sharpen: {
    kernel: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    label: { "zh-CN": "锐化", en: "Sharpen" },
  },
  edge: {
    kernel: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
    label: { "zh-CN": "边缘", en: "Edge detect" },
  },
  blur: {
    kernel: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
    label: { "zh-CN": "模糊", en: "Box blur" },
  },
  sobelX: {
    kernel: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    label: { "zh-CN": "Sobel X", en: "Sobel X" },
  },
  sobelY: {
    kernel: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
    label: { "zh-CN": "Sobel Y", en: "Sobel Y" },
  },
  emboss: {
    kernel: [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2],
    ],
    label: { "zh-CN": "浮雕", en: "Emboss" },
  },
};

/** Generate a simple sample grayscale image (checker + circle + gradient). */
export function makeSampleGray(size = 128): Float32Array {
  const out = new Float32Array(size * size);
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const checker = ((x >> 4) + (y >> 4)) % 2 === 0 ? 0.85 : 0.25;
      const dx = x - cx;
      const dy = y - cy;
      const circle = Math.sqrt(dx * dx + dy * dy) < size * 0.28 ? 0.95 : 0;
      const grad = x / size;
      out[i] = Math.min(1, Math.max(0, checker * 0.45 + circle * 0.4 + grad * 0.25));
    }
  }
  return out;
}

export function rgbaToGray(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): Float32Array {
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    out[i] = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;
  }
  return out;
}

export function grayToRgba(gray: Float32Array, w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = Math.round(Math.min(1, Math.max(0, gray[i])) * 255);
    const o = i * 4;
    data[o] = v;
    data[o + 1] = v;
    data[o + 2] = v;
    data[o + 3] = 255;
  }
  return new ImageData(data, w, h);
}

/** Valid (no pad) 3×3 convolution; output is (h-2)×(w-2). */
export function convolve3x3(
  src: Float32Array,
  w: number,
  h: number,
  kernel: Kernel3,
  abs = false,
): { data: Float32Array; w: number; h: number } {
  const ow = w - 2;
  const oh = h - 2;
  const out = new Float32Array(ow * oh);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let s = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          s += src[(y + ky) * w + (x + kx)] * kernel[ky + 1][kx + 1];
        }
      }
      out[(y - 1) * ow + (x - 1)] = abs ? Math.abs(s) : s;
    }
  }
  return { data: out, w: ow, h: oh };
}

/** Normalize float map into [0,1] for display (min-max). */
export function normalize01(data: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const span = max - min || 1;
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = (data[i] - min) / span;
  return out;
}

export function cloneKernel(k: Kernel3): Kernel3 {
  return [
    [k[0][0], k[0][1], k[0][2]],
    [k[1][0], k[1][1], k[1][2]],
    [k[2][0], k[2][1], k[2][2]],
  ];
}
