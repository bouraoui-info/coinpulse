"use client";

import { useState } from "react";

const PERIODS: { label: string; days: number }[] = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "Max", days: 1825 },
];

// [timestamp, price]
type PricePoint = [number, number];

type Props = {
  initialPrices: PricePoint[];
  coinId: string;
  price: number;
};

function SVGLineChart({ prices }: { prices: PricePoint[] }) {
  const W = 680, H = 220, PAD_X = 48, PAD_Y = 16;

  if (!prices.length)
    return (
      <div className="w-full h-55 flex items-center justify-center text-sm" style={{ color: "#a3aed0" }}>
        No chart data
      </div>
    );

  // Downsample to max 300 points for performance
  const sampled = prices.length > 300
    ? prices.filter((_, i) => i % Math.ceil(prices.length / 300) === 0)
    : prices;

  const values = sampled.map(([, p]) => p);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const isUp = values[values.length - 1] >= values[0];
  const lineColor = isUp ? "#76da44" : "#ff685f";
  const gradientId = "lineGrad";

  const scaleX = (i: number) =>
    PAD_X + (i / (sampled.length - 1)) * (W - PAD_X * 2);
  const scaleY = (v: number) =>
    PAD_Y + (1 - (v - minVal) / range) * (H - PAD_Y * 2);

  // Build SVG path
  const points = sampled.map(([, p], i) => `${scaleX(i)},${scaleY(p)}`);
  const linePath = `M ${points.join(" L ")}`;

  // Area fill path (close back to bottom)
  const areaPath =
    `M ${scaleX(0)},${H - PAD_Y} ` +
    `L ${points.join(" L ")} ` +
    `L ${scaleX(sampled.length - 1)},${H - PAD_Y} Z`;

  // Grid lines (4 horizontal)
  const gridLines = Array.from({ length: 4 }, (_, i) =>
    minVal + (range / 3) * i
  );

  // X-axis labels (4 evenly spaced)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const xLabelIndices = Array.from(new Set([0, Math.floor(sampled.length / 3), Math.floor((2 * sampled.length) / 3), sampled.length - 1]))
    .filter(i => i >= 0 && i < sampled.length);

  const xLabels = xLabelIndices.map(i => {
    const d = new Date(sampled[i][0]);
    return { x: scaleX(i), label: `${months[d.getMonth()]} ${d.getDate()}` };
  });

  const fmtGrid = (v: number) =>
    v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridLines.map((p, i) => (
        <g key={i}>
          <line
            x1={PAD_X} y1={scaleY(p)}
            x2={W - PAD_X} y2={scaleY(p)}
            stroke="#1e2833" strokeWidth="1"
          />
          <text x={W - PAD_X + 4} y={scaleY(p) + 4} fill="#a3aed0" fontSize="9" fontFamily="monospace">
            {fmtGrid(p)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* End dot */}
      <circle
        cx={scaleX(sampled.length - 1)}
        cy={scaleY(values[values.length - 1])}
        r="3"
        fill={lineColor}
      />

      {/* X-axis labels */}
      {xLabels.map(({ x, label }, i) => (
        <text key={`x-label-${i}`} x={x} y={H + 14} textAnchor="middle" fill="#a3aed0" fontSize="9" fontFamily="monospace">
          {label}
        </text>
      ))}
    </svg>
  );
}

export default function LineChart({ initialPrices, coinId, price }: Props) {
  const [prices, setPrices] = useState<PricePoint[]>(initialPrices);
  const [activePeriod, setActivePeriod] = useState("6M");
  const [loading, setLoading] = useState(false);

  async function changePeriod(label: string, days: number) {
    setActivePeriod(label);
    setLoading(true);
    try {
      const res = await fetch(`/api/ohlc?coinId=${coinId}&days=${days}`);
      const data: PricePoint[] = await res.json();
      setPrices(data);
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Period buttons */}
      <div className="flex gap-1 mb-4">
        {PERIODS.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => changePeriod(label, days)}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            style={{
              background: activePeriod === label ? "#76da44" : "transparent",
              color: activePeriod === label ? "#000510" : "#a3aed0",
              border: "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full rounded-lg relative overflow-hidden" style={{ background: "#151c22" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "#151c2299" }}>
            <span className="text-xs" style={{ color: "#a3aed0" }}>Loading…</span>
          </div>
        )}
        <SVGLineChart prices={prices} />
      </div>

      <p className="mt-2 text-xs" style={{ color: "#a3aed0" }}>
        Current price:{" "}
        <span className="font-semibold" style={{ color: "#e8eaf0" }}>
          ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </p>
    </div>
  );
}