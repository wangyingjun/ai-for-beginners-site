"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRESET_KERNELS,
  cloneKernel,
  convolve3x3,
  grayToRgba,
  makeSampleGray,
  normalize01,
  rgbaToGray,
  type Kernel3,
} from "@/lib/ml/convolution";
import { t, type Locale } from "@/lib/i18n";

const SIZE = 160;

export function ConvKernelDemo({
  locale,
  showFullscreenLink = true,
}: {
  locale: Locale;
  showFullscreenLink?: boolean;
}) {
  const srcRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  const [kernel, setKernel] = useState<Kernel3>(() =>
    cloneKernel(PRESET_KERNELS.edge.kernel),
  );
  const [srcGray, setSrcGray] = useState<Float32Array>(() => makeSampleGray(SIZE));
  const [absMode, setAbsMode] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const paint = useCallback(() => {
    const srcCanvas = srcRef.current;
    const outCanvas = outRef.current;
    if (!srcCanvas || !outCanvas) return;
    const sctx = srcCanvas.getContext("2d");
    const octx = outCanvas.getContext("2d");
    if (!sctx || !octx) return;

    const srcImg = grayToRgba(srcGray, SIZE, SIZE);
    sctx.putImageData(srcImg, 0, 0);

    const { data, w, h } = convolve3x3(srcGray, SIZE, SIZE, kernel, absMode);
    const norm = normalize01(data);
    // Upscale result onto SIZE canvas
    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    tmp.getContext("2d")!.putImageData(grayToRgba(norm, w, h), 0, 0);
    octx.imageSmoothingEnabled = false;
    octx.clearRect(0, 0, SIZE, SIZE);
    octx.drawImage(tmp, 0, 0, SIZE, SIZE);
  }, [srcGray, kernel, absMode]);

  useEffect(() => {
    paint();
  }, [paint]);

  function setCell(r: number, c: number, v: number) {
    setKernel((k) => {
      const n = cloneKernel(k);
      n[r]![c] = v;
      return n;
    });
  }

  function onUpload(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = SIZE;
      c.height = SIZE;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, SIZE, SIZE);
      const scale = Math.min(SIZE / img.width, SIZE / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
      const id = ctx.getImageData(0, 0, SIZE, SIZE);
      setSrcGray(rgbaToGray(id.data, SIZE, SIZE));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(locale, "demoConvTitle")}</h3>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">{t(locale, "demoConvHint")}</p>
        </div>
        {showFullscreenLink && (
          <a
            href={`/demos/conv-kernel?lang=${locale}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {t(locale, "demoOpenFullscreen")}
          </a>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-wrap justify-center gap-4">
          <figure className="text-center">
            <canvas
              ref={srcRef}
              width={SIZE}
              height={SIZE}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700"
              aria-label={t(locale, "demoConvSrcAria")}
            />
            <figcaption className="mt-1 text-xs text-zinc-500">
              {t(locale, "demoConvSource")}
            </figcaption>
          </figure>
          <figure className="text-center">
            <canvas
              ref={outRef}
              width={SIZE}
              height={SIZE}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700"
              aria-label={t(locale, "demoConvOutAria")}
            />
            <figcaption className="mt-1 text-xs text-zinc-500">
              {t(locale, "demoConvResult")}
            </figcaption>
          </figure>
        </div>

        <div className="min-w-0 flex-1 space-y-4 text-sm">
          <div>
            <p className="mb-2 font-medium">{t(locale, "demoConvKernel")}</p>
            <div className="inline-grid grid-cols-3 gap-1">
              {([0, 1, 2] as const).map((r) =>
                ([0, 1, 2] as const).map((c) => (
                  <input
                    key={`${r}-${c}`}
                    type="number"
                    step={0.1}
                    value={Number(kernel[r]![c]!.toFixed(3))}
                    onChange={(e) => setCell(r, c, Number(e.target.value))}
                    className="w-16 rounded border border-zinc-300 bg-white px-1 py-1 text-center font-mono text-xs dark:border-zinc-600 dark:bg-zinc-900"
                  />
                )),
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESET_KERNELS).map(([id, p]) => (
              <button
                key={id}
                type="button"
                onClick={() => setKernel(cloneKernel(p.kernel))}
                className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {p.label[locale]}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={absMode}
              onChange={(e) => setAbsMode(e.target.checked)}
            />
            {t(locale, "demoConvAbs")}
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSrcGray(makeSampleGray(SIZE))}
              className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
            >
              {t(locale, "demoConvSample")}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-indigo-600 px-3 py-1.5 font-medium text-indigo-700 dark:text-indigo-300"
            >
              {t(locale, "demoConvUpload")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
