"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { TokenBalance } from "@/hooks/useTokenBalance";

const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "TKN";
const TOKEN_MINT   = process.env.NEXT_PUBLIC_TOKEN_MINT   ?? "";

interface Props {
  balances: TokenBalance;
}

export function WalletPanel({ balances }: Props) {
  const { connected, publicKey } = useWallet();

  if (!connected || !publicKey) {
    return (
      <div
        className="rounded-lg p-5 text-center space-y-3"
        style={{
          background: "rgba(10,10,18,0.8)",
          border:     "1px solid #1a1a2e",
        }}
      >
        <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mx-auto">
          <span className="text-2xl">◈</span>
        </div>
        <div>
          <p className="font-display text-sm font-bold text-white tracking-widest">CONNECT WALLET</p>
          <p className="font-mono text-xs text-muted mt-1">to view balances & trade</p>
        </div>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "rgba(10,10,18,0.8)",
        border:     "1px solid #1a1a2e",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1a1a2e" }}
      >
        <h3 className="font-display text-xs font-bold tracking-widest text-white">
          WALLET
        </h3>
        <span className="font-mono text-xs text-muted">
          {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* SOL balance */}
        <BalanceRow
          symbol="SOL"
          amount={balances.solFormatted}
          label="Native SOL"
          color="#9ca3af"
          loading={balances.loading}
        />

        {/* Token balance */}
        <BalanceRow
          symbol={TOKEN_SYMBOL}
          amount={balances.tknFormatted}
          label={TOKEN_MINT ? TOKEN_MINT.slice(0, 8) + "..." : "Not configured"}
          color="#00ff88"
          loading={balances.loading}
        />

        {balances.error && (
          <p className="font-mono text-xs text-red-400">⚠ {balances.error}</p>
        )}

        {/* Explorer link */}
        <a
          href={`https://solscan.io/account/${publicKey.toBase58()}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
          className="block text-center font-mono text-xs text-muted hover:text-accent transition-colors pt-1"
        >
          View on Solscan ↗
        </a>
      </div>
    </div>
  );
}

function BalanceRow({
  symbol,
  amount,
  label,
  color,
  loading,
}: {
  symbol:  string;
  amount:  string;
  label:   string;
  color:   string;
  loading: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded"
      style={{ background: "#050508", border: "1px solid #1a1a2e" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
        >
          {symbol.slice(0, 2)}
        </div>
        <div>
          <p className="font-mono text-xs font-bold text-white">{symbol}</p>
          <p className="font-mono text-xs text-muted">{label}</p>
        </div>
      </div>
      <span
        className={`font-mono text-sm font-bold num-live ${loading ? "opacity-50" : ""}`}
        style={{ color }}
      >
        {loading ? "..." : amount}
      </span>
    </div>
  );
}
