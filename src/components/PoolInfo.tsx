"use client";

import type { PoolData } from "@/hooks/usePoolData";

const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "TKN";
const TOKEN_MINT   = process.env.NEXT_PUBLIC_TOKEN_MINT   ?? "";
const POOL_ID      = process.env.NEXT_PUBLIC_POOL_ID      ?? "";
const NETWORK      = process.env.NEXT_PUBLIC_NETWORK      ?? "devnet";

interface Props {
  pool: PoolData;
}

export function PoolInfo({ pool }: Props) {
  const cluster = NETWORK === "mainnet-beta" ? "" : "?cluster=devnet";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "rgba(10,10,18,0.8)",
        border:     "1px solid #1a1a2e",
      }}
    >
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid #1a1a2e" }}
      >
        <h3 className="font-display text-xs font-bold tracking-widest text-white">
          POOL DETAILS
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <InfoCell
            label="Pool ID"
            value={POOL_ID ? POOL_ID.slice(0, 12) + "..." : "Not configured"}
            link={POOL_ID ? `https://solscan.io/account/${POOL_ID}${cluster}` : undefined}
          />
          <InfoCell
            label="Token Mint"
            value={TOKEN_MINT ? TOKEN_MINT.slice(0, 12) + "..." : "Not configured"}
            link={TOKEN_MINT ? `https://solscan.io/token/${TOKEN_MINT}${cluster}` : undefined}
          />
          <InfoCell
            label="K Constant (×10⁻⁶)"
            value={pool.solReserve.mul(pool.tokenReserve).toExponential(3)}
          />
          <InfoCell
            label="SOL/Token Ratio"
            value={`${pool.solReserve.div(pool.tokenReserve).toFixed(9)}`}
          />
          <InfoCell label="Fee Tier"  value="0.25% (standard)" />
          <InfoCell label="Protocol"  value="Raydium AMM v4" />
          <InfoCell label="Network"   value={NETWORK.toUpperCase()} accent />
          <InfoCell
            label="Data Refresh"
            value={pool.lastUpdated
              ? pool.lastUpdated.toLocaleTimeString()
              : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  link,
  accent,
}: {
  label:   string;
  value:   string;
  link?:   string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-xs text-muted mb-0.5">{label}</p>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-accent hover:text-white transition-colors underline break-all"
        >
          {value} ↗
        </a>
      ) : (
        <p className={`font-mono text-xs break-all ${accent ? "text-gold" : "text-white"}`}>
          {value}
        </p>
      )}
    </div>
  );
}
