"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, ExpCanvas, StatusPill, btnPrimary, chip, isDark } from "@/components/lesson/ui";
import { FEATURES, REVIEWS, axisSeparable, features, separable, type FeatureId, type Review } from "@/lib/ml/reviews";

export type DataState = {
  xf: FeatureId;
  yf: FeatureId;
  separated: boolean;
  xAlone: boolean;
  tapped: number;
  custom: number;
  pairsTried: number;
};

const name = (id: FeatureId) => FEATURES.find((f) => f.id === id)!.name;

export function DataExperiment({
  allowCustom = false,
  onState,
}: {
  allowCustom?: boolean;
  onState?: (s: DataState) => void;
}) {
  const [xf, setXf] = useState<FeatureId>("len");
  const [yf, setYf] = useState<FeatureId>("bang");
  const [selected, setSelected] = useState<number | null>(null);
  const [tappedSet, setTappedSet] = useState<number[]>([]);
  const [extra, setExtra] = useState<Review[]>([]);
  const [draft, setDraft] = useState("");
  const [draftLabel, setDraftLabel] = useState<0 | 1>(1);
  const [pairs, setPairs] = useState<string[]>(["len|bang"]);

  const all = useMemo(() => [...REVIEWS, ...extra], [extra]);
  const pts = useMemo(
    () => all.map((r) => ({ ...r, f: features(r.text) })).map((r) => ({ ...r, x: r.f[xf], y: r.f[yf] })),
    [all, xf, yf],
  );
  const sep = useMemo(() => separable(pts), [pts]);
  const xAlone = useMemo(() => axisSeparable(pts.map((p) => p.x), pts.map((p) => p.label)), [pts]);

  useEffect(() => {
    onState?.({ xf, yf, separated: sep.ok && xf !== yf, xAlone, tapped: tappedSet.length, custom: extra.length, pairsTried: pairs.length });
  }, [xf, yf, sep.ok, xAlone, tappedSet, extra, pairs, onState]);

  const pick = (axis: "x" | "y", id: FeatureId) => {
    const nx = axis === "x" ? id : xf;
    const ny = axis === "y" ? id : yf;
    if (axis === "x") setXf(id);
    else setYf(id);
    const key = `${nx}|${ny}`;
    setPairs((p) => (p.includes(key) ? p : [...p, key]));
  };

  const maxX = Math.max(4, ...pts.map((p) => p.x)) + 1;
  const maxY = Math.max(4, ...pts.map((p) => p.y)) + 1;
  // Jitter identical points so they don't hide each other.
  const placed = useMemo(() => {
    const seen = new Map<string, number>();
    return pts.map((p) => {
      const k = `${p.x}|${p.y}`;
      const n = seen.get(k) ?? 0;
      seen.set(k, n + 1);
      const ang = n * 2.4;
      const r = n === 0 ? 0 : 0.18 + 0.06 * n;
      return { ...p, jx: p.x + Math.cos(ang) * r, jy: p.y + Math.sin(ang) * r };
    });
  }, [pts]);

  const geom = (w: number, h: number) => {
    const pad = 28;
    return {
      sx: (x: number) => pad + ((x + 0.5) / (maxX + 0.5)) * (w - pad - 8),
      sy: (y: number) => h - pad - ((y + 0.5) / (maxY + 0.5)) * (h - pad - 8),
      pad,
    };
  };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const { sx, sy, pad } = geom(w, h);
      ctx.strokeStyle = dark ? "#3f3f46" : "#d4d4d8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, 4);
      ctx.lineTo(pad, h - pad);
      ctx.lineTo(w - 4, h - pad);
      ctx.stroke();
      ctx.fillStyle = dark ? "#a1a1aa" : "#71717a";
      ctx.font = "11px system-ui";
      for (let x = 0; x < maxX; x += maxX > 10 ? 4 : 1) ctx.fillText(String(x), sx(x) - 3, h - pad + 13);
      for (let y = 0; y < maxY; y += maxY > 10 ? 4 : 1) ctx.fillText(String(y), pad - 14, sy(y) + 4);
      ctx.font = "12px system-ui";
      ctx.fillText(`${name(xf)} →`, w - 70, h - 4);
      ctx.fillText(`↑ ${name(yf)}`, 4, 14);
      if (sep.ok && xf !== yf) {
        const [w0, w1, w2] = sep.w;
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        if (Math.abs(w2) > 1e-6) {
          const y0 = -(w0 + w1 * -0.5) / w2;
          const y1 = -(w0 + w1 * maxX) / w2;
          ctx.moveTo(sx(-0.5), sy(y0));
          ctx.lineTo(sx(maxX), sy(y1));
        } else {
          const x0 = -w0 / w1;
          ctx.moveTo(sx(x0), sy(-0.5));
          ctx.lineTo(sx(x0), sy(maxY));
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
      placed.forEach((p, i) => {
        const x = sx(p.jx);
        const y = sy(p.jy);
        ctx.fillStyle = p.label === 1 ? COLORS.red : COLORS.blue;
        ctx.beginPath();
        if (p.label === 1) ctx.arc(x, y, 7, 0, Math.PI * 2);
        else ctx.rect(x - 6, y - 6, 12, 12);
        ctx.fill();
        if (i >= REVIEWS.length || i === selected) {
          ctx.strokeStyle = i === selected ? COLORS.yellow : dark ? "#f4f4f5" : "#18181b";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [placed, sep, xf, yf, selected, maxX, maxY],
  );

  const onPointer = (u: number, v: number, kind: "down" | "move" | "up", w: number, h: number) => {
    if (kind !== "down") return;
    const { sx, sy } = geom(w, h);
    let best = -1;
    let bd = 1e9;
    placed.forEach((p, i) => {
      const d = (sx(p.jx) / w - u) ** 2 + (sy(p.jy) / h - v) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0 && bd < 0.006) {
      setSelected(best);
      setTappedSet((t) => (t.includes(best) ? t : [...t, best]));
    }
  };

  const sel = selected !== null ? placed[selected] : null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill ok={sep.ok && xf !== yf}>
          {xf === yf ? "两个轴选了同一个" : sep.ok ? "能用一条直线分开 ✅" : "红蓝混在一起，一条直线分不开"}
        </StatusPill>
      </div>
      <ExpCanvas
        draw={draw}
        version={`${xf}|${yf}|${selected}|${extra.length}`}
        aspect={0.8}
        onPointer={onPointer}
        ariaLabel="外卖评论散点图：红色圆点是好评，蓝色方块是差评"
      />
      <p className="text-xs text-zinc-500">
        <span className="font-semibold text-red-600">● 红点 = 好评</span>，<span className="font-semibold text-blue-600">■ 蓝块 = 差评</span>。点一下某个点，看它是哪条评论。
      </p>
      {sel && (
        <p className="rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800" aria-live="polite">
          「{sel.text}」 → {name(xf)} = {sel.x}，{name(yf)} = {sel.y}（{sel.label === 1 ? "好评" : "差评"}）
        </p>
      )}
      {(["x", "y"] as const).map((axis) => (
        <div key={axis} className="flex flex-wrap items-center gap-1.5">
          <span className="w-14 text-sm font-medium">{axis === "x" ? "横轴：" : "竖轴："}</span>
          {FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              title={f.help}
              className={chip((axis === "x" ? xf : yf) === f.id)}
              onClick={() => pick(axis, f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      ))}
      <details className="text-xs text-zinc-500">
        <summary className="cursor-pointer">这几个数字是怎么数出来的？</summary>
        <ul className="mt-1 list-disc pl-5">
          {FEATURES.map((f) => (
            <li key={f.id}>
              {f.name}：{f.help}
            </li>
          ))}
        </ul>
      </details>
      {allowCustom && (
        <div className="space-y-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
          <label className="block text-sm font-medium" htmlFor="custom-review">
            自己写一条评论，看它落在哪：
          </label>
          <input
            id="custom-review"
            value={draft}
            maxLength={40}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="比如：太慢了，饭都凉了"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(draftLabel === 1)} onClick={() => setDraftLabel(1)}>
              这是好评
            </button>
            <button type="button" className={chip(draftLabel === 0)} onClick={() => setDraftLabel(0)}>
              这是差评
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={!draft.trim()}
              onClick={() => {
                setExtra((e) => [...e, { text: draft.trim(), label: draftLabel }]);
                setSelected(REVIEWS.length + extra.length);
                setDraft("");
              }}
            >
              放到图上
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
