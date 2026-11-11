"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Shared look for experiment controls (mobile-friendly touch targets). */
export const btnBase = "min-h-10 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40";
export const btnPrimary = `${btnBase} bg-indigo-600 text-white hover:bg-indigo-500`;
export const btnSecondary = `${btnBase} border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100`;
export function chip(active: boolean): string {
  return `${btnBase} border ${active ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200" : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"}`;
}

export const COLORS = {
  red: "#dc2626",
  blue: "#2563eb",
  yellow: "#f59e0b",
  ink: "#18181b",
  inkDark: "#f4f4f5",
};

export const Red = ({ children = "红点" }: { children?: ReactNode }) => (
  <span className="font-semibold text-red-600 dark:text-red-400">{children}</span>
);
export const Blue = ({ children = "蓝点" }: { children?: ReactNode }) => (
  <span className="font-semibold text-blue-600 dark:text-blue-400">{children}</span>
);
export const Yellow = ({ children }: { children: ReactNode }) => (
  <span className="font-semibold text-amber-600 dark:text-amber-400">{children}</span>
);

export function StatusPill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      aria-live="polite"
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${ok ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"}`}
    >
      {children}
    </span>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v: number) => v.toFixed(2),
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="flex max-w-[420px] flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-[9rem] flex-1"
      />
      <span className="w-12 font-mono">{format(value)}</span>
    </label>
  );
}

export function isDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Responsive square-ish canvas. `draw(ctx, w, h, now)` is called on every
 * animation frame when `animate`, otherwise whenever `version` changes or the
 * size changes. Pointer callbacks receive coordinates in [0,1]².
 */
export function ExpCanvas({
  draw,
  version,
  animate = false,
  aspect = 1,
  maxWidth = 420,
  onPointer,
  ariaLabel,
  className = "",
}: {
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, now: number) => void;
  version?: unknown;
  animate?: boolean;
  aspect?: number;
  maxWidth?: number;
  onPointer?: (u: number, v: number, kind: "down" | "move" | "up") => void;
  ariaLabel: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef(draw);
  const widthRef = useRef(300);
  const draggingRef = useRef(false);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    let raf = 0;
    const paint = (now: number) => {
      const w = widthRef.current;
      const h = Math.round(w * aspect);
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isDark() ? "#18181b" : "#fafafa";
      ctx.fillRect(0, 0, w, h);
      drawRef.current(ctx, w, h, now);
    };
    const measure = () => {
      widthRef.current = Math.max(220, Math.min(maxWidth, Math.floor(el.clientWidth)));
    };
    measure();
    const ro = new ResizeObserver(() => {
      measure();
      if (!animate) paint(performance.now());
    });
    ro.observe(el);
    if (animate) {
      const loop = (now: number) => {
        paint(now);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      paint(performance.now());
    }
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [animate, aspect, maxWidth, version]);

  const toUV = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as const;
  };

  return (
    <div ref={wrapRef} className="w-full" style={{ maxWidth }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className={`${onPointer ? "touch-none" : ""} rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}
        onPointerDown={(e) => {
          if (!onPointer) return;
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const [u, v] = toUV(e);
          onPointer(u, v, "down");
        }}
        onPointerMove={(e) => {
          if (!onPointer || !draggingRef.current) return;
          const [u, v] = toUV(e);
          onPointer(u, v, "move");
        }}
        onPointerUp={(e) => {
          if (!onPointer) return;
          draggingRef.current = false;
          const [u, v] = toUV(e);
          onPointer(u, v, "up");
        }}
      />
    </div>
  );
}
