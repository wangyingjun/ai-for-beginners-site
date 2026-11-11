"use client";

import { useEffect, useMemo, useState } from "react";
import { PixelGrid, Slider, StatusPill, chip } from "@/components/lesson/ui";
import { AE_IMAGES, NOISE_AT, reconstruct, withNoise, wrongCells } from "@/lib/ml/dct8";

export type AeState = { img: string; k: number; wrong: number; noisy: boolean; wrongVsClean: number; inputWrong: number };

export function AutoencoderExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: AeState) => void }) {
  const [img, setImg] = useState("smile");
  const [k, setK] = useState(64);
  const [noisy, setNoisy] = useState(false);
  const clean = AE_IMAGES[img].px;
  const input = useMemo(() => (noisy ? withNoise(clean) : clean), [noisy, clean]);
  const rec = useMemo(() => reconstruct(input, k), [input, k]);
  const wrong = wrongCells(input, rec);
  const wrongVsClean = wrongCells(clean, rec);
  const inputWrong = noisy ? NOISE_AT.length : 0;

  useEffect(() => {
    onState?.({ img, k, wrong, noisy, wrongVsClean, inputWrong });
  }, [img, k, wrong, noisy, wrongVsClean, inputWrong, onState]);

  const target = noisy ? clean : input;
  return (
    <div className="space-y-3">
      <StatusPill ok={wrong === 0}>
        只用 {k} 个数记住这张图 · 还原后有 {wrong} 格不一样
      </StatusPill>
      <div className="flex items-end gap-2">
        <PixelGrid size={100} px={input} label={noisy ? "输入（带噪点）" : "原图（64 格）"} ring={(i) => (noisy && NOISE_AT.includes(i) ? "#f59e0b" : undefined)} />
        <div className="flex w-14 shrink-0 flex-col items-center gap-1 pb-8 text-center text-xs text-zinc-500">
          <span aria-hidden>→</span>
          <span>只剩</span>
          <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 font-mono text-sm text-white">{k}</span>
          <span>个数</span>
          <span aria-hidden>→</span>
        </div>
        <PixelGrid size={100} px={rec} label="还原出来的图" ring={(i) => ((rec[i] >= 0.5 ? 1 : 0) !== target[i] ? "#f59e0b" : undefined)} />
      </div>
      <p className="text-xs text-zinc-500">
        还原图里 <span className="font-semibold text-amber-600">黄框</span> = 和{noisy ? "干净原图" : "原图"}不一样的格子。
      </p>
      <Slider label="中间留几个数" value={k} min={1} max={64} step={1} onChange={setK} format={(v) => String(v)} />
      {controls && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(AE_IMAGES).map(([id, v]) => (
            <button key={id} type="button" className={chip(img === id)} onClick={() => setImg(id)}>
              {v.name}
            </button>
          ))}
          <button type="button" className={chip(noisy)} onClick={() => setNoisy((x) => !x)}>
            {noisy ? "去掉噪点" : "给输入加噪点"}
          </button>
        </div>
      )}
    </div>
  );
}
