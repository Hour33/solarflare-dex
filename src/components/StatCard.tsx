"use client";

type AccentColor = "accent" | "gold" | "plasma" | "danger";

const accentMap: Record<AccentColor, { border: string; text: string; glow: string }> = {
  accent: { border: "#00ff8830", text: "#00ff88", glow: "0 0 20px #00ff8820" },
  gold:   { border: "#f59e0b30", text: "#f59e0b", glow: "0 0 20px #f59e0b20" },
  plasma: { border: "#7c3aed30", text: "#a78bfa", glow: "0 0 20px #7c3aed20" },
  danger: { border: "#ef444430", text: "#ef4444", glow: "0 0 20px #ef444420" },
};

interface StatCardProps {
  label:   string;
  value:   string;
  sub?:    string;
  change?: number;
  accent?: AccentColor;
}

export function StatCard({ label, value, sub, change, accent = "accent" }: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <div
      className="rounded-lg p-4 relative overflow-hidden"
      style={{
        background:   "rgba(10,10,18,0.8)",
        border:       `1px solid ${colors.border}`,
        boxShadow:    colors.glow,
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${colors.text}, transparent)` }}
      />

      <p className="font-mono text-xs text-muted tracking-widest uppercase mb-2">{label}</p>

      <p
        className="font-display text-lg font-bold num-live"
        style={{ color: colors.text }}
      >
        {value}
      </p>

      {sub && (
        <p className="font-mono text-xs text-muted mt-1">{sub}</p>
      )}

      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 font-mono text-xs ${
          change >= 0 ? "text-green-400" : "text-red-400"
        }`}>
          <span>{change >= 0 ? "▲" : "▼"}</span>
          <span>{Math.abs(change).toFixed(3)}%</span>
        </div>
      )}
    </div>
  );
}
