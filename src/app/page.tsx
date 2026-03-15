"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { TopBar } from "@/components/TopBar";
import { StatCard } from "@/components/StatCard";
import { PriceChart } from "@/components/PriceChart";
import { SwapPanel } from "@/components/SwapPanel";
import { WalletPanel } from "@/components/WalletPanel";
import { PoolInfo } from "@/components/PoolInfo";
import { usePoolData } from "@/hooks/usePoolData";
import { useTokenBalance } from "@/hooks/useTokenBalance";

const TOKEN_NAME   = process.env.NEXT_PUBLIC_TOKEN_NAME   ?? "Token";
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "TKN";
const NETWORK      = process.env.NEXT_PUBLIC_NETWORK      ?? "devnet";

export default function Dashboard() {
  const { connected }  = useWallet();
  const pool           = usePoolData();
  const balances       = useTokenBalance();

  return (
    <div className="scanline min-h-screen bg-void bg-grid-void bg-grid-void">
      {/* Ambient glow blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-accent opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-plasma opacity-[0.04] rounded-full blur-[100px] pointer-events-none" />

      <TopBar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Network badge ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wider text-white">
              {TOKEN_NAME}
              <span className="text-accent text-glow ml-2">/{TOKEN_SYMBOL}</span>
            </h1>
            <p className="font-mono text-xs text-muted mt-1">
              PRIVATE TESTNET · {NETWORK.toUpperCase()} ·{" "}
              <span className="text-accent num-live">● LIVE</span>
            </p>
          </div>

          {!connected && (
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-xs text-muted">Connect to trade</span>
              <WalletMultiButton />
            </div>
          )}
        </div>

        {/* ── Stat row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Price"
            value={`${pool.price.toFixed(9)} SOL`}
            sub={`$${pool.priceUSD.toFixed(6)}`}
            change={pool.priceChange24h}
            accent="accent"
          />
          <StatCard
            label="SOL Reserve"
            value={`${pool.solReserve.toFixed(4)} SOL`}
            sub="Pool liquidity (SOL side)"
            accent="gold"
          />
          <StatCard
            label={`${TOKEN_SYMBOL} Reserve`}
            value={pool.tokenReserve.toNumber().toLocaleString()}
            sub="Pool liquidity (token side)"
            accent="plasma"
          />
          <StatCard
            label="TVL"
            value={`${pool.tvlSOL.toFixed(3)} SOL`}
            sub={`~$${pool.tvlSOL.mul(145).toFixed(0)} USD`}
            accent="accent"
          />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chart — spans 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <PriceChart
              data={pool.priceHistory}
              currentPrice={pool.price.toNumber()}
            />
            <PoolInfo pool={pool} />
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <WalletPanel balances={balances} />
            <SwapPanel pool={pool} balances={balances} onSwapComplete={balances.refresh} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">
            ⚠ PRIVATE TESTNET · Not financial advice · Development build
          </span>
          <span className="font-mono text-xs text-muted">
            {pool.lastUpdated
              ? `Updated ${pool.lastUpdated.toLocaleTimeString()}`
              : "Connecting..."}
          </span>
        </div>
      </main>
    </div>
  );
}
