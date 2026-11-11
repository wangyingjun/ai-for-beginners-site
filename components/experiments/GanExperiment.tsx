"use client";

import { useEffect, useMemo, useState } from "react";
import { ExpCanvas, Slider, StatusPill, btnPrimary, chip, isDark } from "@/components/lesson/ui";
import { BINS, REAL, genDensity, genStep, judgeAcc, judgeCurve, type GenParams } from "@/lib/ml/gan1d";

type DataId = "one" | "two";
export type GanState = { data: DataId; two: boolean; acc: number; running: boolean; lastAuto: { data: DataId; two: boolean; acc: number } | null };

const start = (two: boolean): GenParams => (two ? { mu1: 4, sd1: 1.5, mu2: 6, sd2: 1.5, two: true } : { mu1: 2, sd1: 2.5, mu2: 6, sd2: 1.5, two: false });
const MAX_ROUNDS = 60;

export function GanExperiment({ controls = false, onState }: { controls?: boolean; onState?: (s: GanState) => void }) {
  const [data, setData] = useState<DataId>("one");
  const [p, setP] = useState<GenParams>(() => start(false));
  const [running, setRunning] = useState(false);
  const [round, setRound] = useState(0);
  const [lastAuto, setLastAuto] = useState<GanState["lastAuto"]>(null);
  const real = REAL[data];
  const fake = useMemo(() => genDensity(p), [p]);
  const acc = judgeAcc(real, fake);
  const curve = useMemo(() => judgeCurve(real, fake), [real, fake]);

  useEffect(() => {
    onState?.({ data, two: p.two, acc, running, lastAuto });
  }, [data, p.two, acc, running, lastAuto, onState]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRound((r) => r + 1);
      setP((cur) => genStep(REAL[data], cur));
    }, 80);
    return () => window.clearInterval(id);
  }, [running, data]);

  useEffect(() => {
    if (!running) return;
    if (round >= MAX_ROUNDS || acc <= 0.505) {
      const t = window.setTimeout(() => {
        setRunning(false);
        setLastAuto({ data, two: p.two, acc });
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [running, round, acc, data, p.two]);

  const reset = (d: DataId, two: boolean) => {
    setRunning(false);
    setData(d);
    setP(start(two));
    setRound(0);
  };

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const pad = 18;
    const bw = (w - 2 * pad) / BINS;
    const top = 14;
    const base = h - 22;
    const peak = Math.max(...real, ...fake, 0.01);
    const sc = (base - top - 30) / peak;
    for (let i = 0; i < BINS; i++) {
      const x = pad + i * bw;
      ctx.fillStyle = "rgba(220,38,38,0.55)";
      ctx.fillRect(x, base - real[i] * sc, bw / 2, real[i] * sc);
      ctx.fillStyle = "rgba(37,99,235,0.6)";
      ctx.fillRect(x + bw / 2, base - fake[i] * sc, bw / 2, fake[i] * sc);
    }
    // judge curve: 1 = looks real (top band)
    ctx.strokeStyle = isDark() ? "#e4e4e7" : "#27272a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    curve.forEach((c, i) => {
      const x = pad + (i + 0.5) * bw;
      const y = top + (1 - c) * 24;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = isDark() ? "#a1a1aa" : "#71717a";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("鉴定员觉得「像真的」↑", pad, top - 3 + 0);
    ctx.strokeStyle = isDark() ? "#52525b" : "#d4d4d8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, base + 0.5);
    ctx.lineTo(w - pad, base + 0.5);
    ctx.stroke();
    for (const v of [0, 5, 10]) ctx.fillText(String(v), pad + (v / 10) * (w - 2 * pad) - 3, h - 6);
  };

  return (
    <div className="space-y-3">
      <StatusPill ok={acc <= 0.6}>鉴定员能分辨真假：{Math.round(acc * 100)}%（50% = 完全靠猜）</StatusPill>
      <ExpCanvas draw={draw} version={`${acc}-${data}`} aspect={0.62} ariaLabel="真作品和仿作的分布图" />
      <p className="text-xs text-zinc-500">
        横轴 = 作品的某个特征值。<span className="font-semibold text-red-600">红柱 = 真作品</span>落在哪儿，<span className="font-semibold text-blue-600">蓝柱 = 仿作</span>
        落在哪儿；顶上的黑线越高，鉴定员越觉得那里的作品是真的。
      </p>
      {!p.two && (
        <>
          <Slider label="仿作的中心" value={p.mu1} min={0.5} max={9.5} step={0.1} onChange={(v) => setP((c) => ({ ...c, mu1: v }))} format={(v) => v.toFixed(1)} />
          <Slider label="仿作的分散程度" value={p.sd1} min={0.3} max={4} step={0.1} onChange={(v) => setP((c) => ({ ...c, sd1: v }))} format={(v) => v.toFixed(1)} />
        </>
      )}
      {controls && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} disabled={running} onClick={() => { setRound(0); setRunning(true); }}>
              {running ? `对练中… 第 ${round} 回合` : "让两者自动对练"}
            </button>
            <button type="button" className={chip(false)} onClick={() => reset(data, p.two)}>
              重来
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="self-center text-zinc-500">真作品：</span>
            <button type="button" className={chip(data === "one")} onClick={() => reset("one", p.two)}>一个峰</button>
            <button type="button" className={chip(data === "two")} onClick={() => reset("two", p.two)}>两个峰</button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="self-center text-zinc-500">造假者的本事：</span>
            <button type="button" className={chip(!p.two)} onClick={() => reset(data, false)}>只会画一个峰</button>
            <button type="button" className={chip(p.two)} onClick={() => reset(data, true)}>会画两个峰</button>
          </div>
          {lastAuto && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              上次对练结束：鉴定员还能分辨 {Math.round(lastAuto.acc * 100)}%。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
