"use client";

import { useEffect, useRef } from "react";
import type { OHLC } from "@/lib/signal-engine/types";

export function MiniChart({
  ohlc,
  direction,
}: {
  ohlc: OHLC[];
  direction: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const data = ohlc.slice(-40);
    const highs = data.map((c) => c.high);
    const lows = data.map((c) => c.low);
    const minP = Math.min(...lows) * 0.9998;
    const maxP = Math.max(...highs) * 1.0002;
    const rng = maxP - minP || 0.0001;
    const toY = (p: number) => H - ((p - minP) / rng) * (H - 4) - 2;
    const toX = (i: number) => (i / (data.length - 1)) * (W - 2) + 1;
    ctx.clearRect(0, 0, W, H);
    const col = direction === "CALL" ? "0,214,143" : "255,51,85";
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgba(${col},.2)`);
    grad.addColorStop(1, `rgba(${col},0)`);
    ctx.beginPath();
    data.forEach((c, i) =>
      i === 0 ? ctx.moveTo(toX(i), toY(c.close)) : ctx.lineTo(toX(i), toY(c.close))
    );
    ctx.lineTo(toX(data.length - 1), H);
    ctx.lineTo(toX(0), H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    data.forEach((c, i) =>
      i === 0 ? ctx.moveTo(toX(i), toY(c.close)) : ctx.lineTo(toX(i), toY(c.close))
    );
    ctx.strokeStyle = `rgba(${col},1)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [ohlc, direction]);

  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

export function ConfRing({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 56,
      H = 56,
      r = 23,
      cx = 28,
      cy = 28;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(30,54,85,.8)";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, (pct / 100) * Math.PI * 2 - Math.PI / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();
  }, [pct, color]);
  return (
    <div className="conf-ring-wrap">
      <canvas ref={ref} width={56} height={56} />
      <div className="conf-pct" style={{ color }}>
        {pct}%
      </div>
    </div>
  );
}
