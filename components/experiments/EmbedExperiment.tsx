"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExpCanvas, StatusPill, btnPrimary, chip, isDark } from "@/components/lesson/ui";
import { WORDS, analogy, neighbors, vec } from "@/lib/ml/embed-zh";

export type EmbedState = {
  clicked: string[];
  analogies: string[]; // "a-b+c=r"
};

const GROUP_COLOR: Record<string, string> = { 人: "#7c3aed", 动物: "#0d9488", 地点: "#c2410c", 食物: "#4d7c0f" };

export function EmbedExperiment({
  analogyControl = false,
  onState,
}: {
  analogyControl?: boolean;
  onState?: (s: EmbedState) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [clicked, setClicked] = useState<string[]>([]);
  const [slots, setSlots] = useState<[string, string, string]>(["国王", "男人", "女人"]);
  const [active, setActive] = useState<0 | 1 | 2>(0);
  const [result, setResult] = useState<{ word: string; point: [number, number] } | null>(null);
  const [analogies, setAnalogies] = useState<string[]>([]);

  useEffect(() => {
    onState?.({ clicked, analogies });
  }, [clicked, analogies, onState]);

  const nb = useMemo(() => (selected ? neighbors(selected) : []), [selected]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const dark = isDark();
      const sx = (x: number) => 14 + x * (w - 50);
      const sy = (y: number) => h - 14 - y * (h - 34);
      if (selected) {
        const [x0, y0] = vec(selected);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        for (const n of nb) {
          const [x1, y1] = vec(n);
          ctx.beginPath();
          ctx.moveTo(sx(x0), sy(y0));
          ctx.lineTo(sx(x1), sy(y1));
          ctx.stroke();
        }
      }
      if (result) {
        const [a, b, c] = slots;
        const pa = vec(a);
        const pb = vec(b);
        const pc = vec(c);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx(pb[0]), sy(pb[1]));
        ctx.lineTo(sx(pa[0]), sy(pa[1]));
        ctx.moveTo(sx(pc[0]), sy(pc[1]));
        ctx.lineTo(sx(result.point[0]), sy(result.point[1]));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#6366f1";
        ctx.beginPath();
        ctx.arc(sx(result.point[0]), sy(result.point[1]), 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = "13px system-ui";
      for (const o of WORDS) {
        const x = sx(o.x);
        const y = sy(o.y);
        const isSel = o.word === selected || (result && o.word === result.word);
        ctx.fillStyle = GROUP_COLOR[o.group];
        ctx.beginPath();
        ctx.arc(x, y, isSel ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isSel ? "#d97706" : dark ? "#e4e4e7" : "#27272a";
        ctx.font = isSel ? "bold 14px system-ui" : "13px system-ui";
        ctx.fillText(o.word, x + 6, y - 5);
      }
    },
    [selected, nb, result, slots],
  );

  const onPointer = (u: number, v: number, kind: "down" | "move" | "up", w: number, h: number) => {
    if (kind !== "down") return;
    const px = u * w;
    const py = v * h;
    let best: string | null = null;
    let bd = Infinity;
    for (const o of WORDS) {
      const x = 14 + o.x * (w - 50) + 14;
      const y = h - 14 - o.y * (h - 34) - 4;
      const d = (x - px) ** 2 + (y - py) ** 2;
      if (d < bd) {
        bd = d;
        best = o.word;
      }
    }
    if (best && bd < 30 * 30) {
      setSelected(best);
      setClicked((c) => (c.includes(best) ? c : [...c, best]));
      if (analogyControl) {
        setSlots((s) => {
          const ns = [...s] as [string, string, string];
          ns[active] = best;
          return ns;
        });
        setResult(null);
        setActive((a) => ((a + 1) % 3) as 0 | 1 | 2);
      }
    }
  };

  const compute = () => {
    const r = analogy(...slots);
    setResult(r);
    setSelected(null);
    const key = `${slots[0]}-${slots[1]}+${slots[2]}=${r.word}`;
    setAnalogies((a) => (a.includes(key) ? a : [...a, key]));
  };

  return (
    <div className="space-y-3">
      <ExpCanvas draw={draw} version={`${selected}|${result?.word}|${slots.join()}`} aspect={0.85} onPointer={onPointer} ariaLabel="词语地图：意思相近的词靠得近" />
      <p className="text-xs text-zinc-500">
        颜色只是帮你看分组（<span style={{ color: GROUP_COLOR["人"] }}>人</span>、<span style={{ color: GROUP_COLOR["动物"] }}>动物</span>、
        <span style={{ color: GROUP_COLOR["地点"] }}>地点</span>、<span style={{ color: GROUP_COLOR["食物"] }}>食物</span>），电脑并不知道这些分组。
      </p>
      {selected && !analogyControl && (
        <StatusPill ok>
          离「{selected}」最近的词：{nb.join("、")}
        </StatusPill>
      )}
      {analogyControl && (
        <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-sm">
            词语算术：先点下面的空格选中它，再在地图上点一个词填进去。
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-base">
            {slots.map((w, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i === 1 && <span>−</span>}
                {i === 2 && <span>+</span>}
                <button type="button" className={chip(active === i)} onClick={() => setActive(i as 0 | 1 | 2)}>
                  {w}
                </button>
              </span>
            ))}
            <span>=</span>
            <span className="min-w-12 rounded bg-indigo-100 px-2 py-1 font-semibold dark:bg-indigo-900">{result ? result.word : "？"}</span>
          </div>
          <button type="button" className={btnPrimary} onClick={compute}>
            算一下
          </button>
          {selected && <p className="text-xs text-zinc-500">离「{selected}」最近：{nb.join("、")}</p>}
        </div>
      )}
    </div>
  );
}
