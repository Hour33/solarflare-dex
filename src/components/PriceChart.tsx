"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PricePoint } from "@/hooks/usePoolData";

interface Props {
  data:         PricePoint[];
  currentPrice: number;
}

export function PriceChart({ data, currentPrice }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    time: new Date(d.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  const prices = data.map((d) => d.price).filter(Boolean);
  const min = prices.length ? Math.min(...prices) * 0.995 : 0;
  const max = prices.length ? Math.max(...prices) * 1.005 : 1;

  if (!formatted.length) {
    return (
      <div className="rounded-lg p-4 h-72 flex items-center justify-center"
        style={{ background: "rgba(10,10,18,0.8)", border: "1px solid #1a1a2e" }}>
        <p className="font-mono text-xs text-muted">Loading chart...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4"
      style={{ background: "rgba(10,10,18,0.8)", border: "1px solid #1a1a2e" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-bold tracking-widest text-white">
            PRICE CHART
          </h3>
          <p className="font-mono text-xs text-muted mt-0.5">5s interval</p>
        </div>
        <div className="text-right">
          <p className="font-display text-base font-bold text-accent">
            {currentPrice.toFixed(9)}
          </p>
          <p className="font-mono text-xs text-muted">SOL / token</p>
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00ff88" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#4a4a6a", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[min, max]}
              tick={{ fill: "#4a4a6a", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toExponential(2)}
              width={75}
            />
            <Tooltip
              contentStyle={{ background: "#0a0a12", border: "1px solid #00ff8840", borderRadius: "4px" }}
              labelStyle={{ color: "#4a4a6a", fontSize: "10px" }}
              itemStyle={{ color: "#00ff88", fontSize: "10px" }}
              formatter={(v: number) => [v.toFixed(9) + " SOL", "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00ff88"
              strokeWidth={1.5}
              fill="url(#priceGrad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
