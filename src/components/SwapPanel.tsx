"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSwap, calcAmountOut, type SwapDirection } from "@/hooks/useSwap";
import type { PoolData } from "@/hooks/usePoolData";
import type { TokenBalance } from "@/hooks/useTokenBalance";
import Decimal from "decimal.js";

const TOKEN_SYMBOL   = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "TKN";
const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? "6");
const POOL_ID        = process.env.NEXT_PUBLIC_POOL_ID ?? "";

interface Props {
  pool:           PoolData;
  balances:       TokenBalance;
  onSwapComplete: () => void;
}

export function SwapPanel({ pool, balances, onSwapComplete }: Props) {
  const { connected }            = useWallet();
  const { loading, error, txSignature, lastSwap, executeSwap } = useSwap();

  const [direction, setDirection]   = useState<SwapDirection>("buy");
  const [inputAmt,  setInputAmt]    = useState<string>("");
  const [slippage,  setSlippage]    = useState<number>(0.5);

  // Compute expected output via CPAMM formula
  const { amountOut, priceImpact, newPrice } = useMemo(() => {
    const amt = parseFloat(inputAmt) || 0;
    if (!amt) return { amountOut: new Decimal(0), priceImpact: 0, newPrice: pool.price };

    if (direction === "buy") {
      // SOL in → token out
      return calcAmountOut(new Decimal(amt), pool.solReserve, pool.tokenReserve);
    } else {
      // token in → SOL out (inverted reserves)
      const { amountOut, priceImpact, newPrice } =
        calcAmountOut(new Decimal(amt), pool.tokenReserve, pool.solReserve);
      // newPrice in this case is (tokenReserve / solReserve), invert it
      return { amountOut, priceImpact, newPrice: new Decimal(1).div(newPrice) };
    }
  }, [inputAmt, direction, pool]);

  const handleSwap = async () => {
    const amt = parseFloat(inputAmt);
    if (!amt || isNaN(amt)) return;

    const result = await executeSwap(direction, new Decimal(amt), slippage);
    if (result.success) {
      setInputAmt("");
      onSwapComplete();
    }
  };

  const maxInput = direction === "buy"
    ? balances.solFormatted
    : balances.tknFormatted.replace(/,/g, "");

  const impactColor =
    priceImpact < 1   ? "text-green-400" :
    priceImpact < 5   ? "text-yellow-400" :
                        "text-red-400";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "rgba(10,10,18,0.9)",
        border:     "1px solid #1a1a2e",
        boxShadow:  "0 0 30px rgba(0,255,136,0.06)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1a1a2e" }}
      >
        <h3 className="font-display text-sm font-bold tracking-widest text-white">
          SWAP {!POOL_ID && <span className="text-muted text-xs ml-1">(DEMO)</span>}
        </h3>
        <div className="flex items-center gap-1">
          {[0.1, 0.5, 1.0].map((s) => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              className={`font-mono text-xs px-2 py-0.5 rounded transition-colors ${
                slippage === s
                  ? "bg-accent text-void font-bold"
                  : "text-muted hover:text-white border border-border"
              }`}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Direction toggle */}
        <div
          className="flex rounded overflow-hidden"
          style={{ border: "1px solid #1a1a2e" }}
        >
          {(["buy", "sell"] as SwapDirection[]).map((dir) => (
            <button
              key={dir}
              onClick={() => { setDirection(dir); setInputAmt(""); }}
              className={`flex-1 py-2 font-mono text-xs tracking-widest uppercase transition-all ${
                direction === dir
                  ? dir === "buy"
                    ? "bg-accent text-void font-bold"
                    : "bg-red-500 text-white font-bold"
                  : "text-muted hover:text-white"
              }`}
            >
              {dir === "buy" ? "◆ BUY" : "◇ SELL"}
            </button>
          ))}
        </div>

        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-muted uppercase">
              {direction === "buy" ? "You Pay (SOL)" : `You Pay (${TOKEN_SYMBOL})`}
            </span>
            <button
              onClick={() => setInputAmt(maxInput)}
              className="font-mono text-xs text-accent hover:text-white transition-colors"
            >
              MAX: {maxInput}
            </button>
          </div>
          <div
            className="flex items-center rounded px-3 py-2 gap-2"
            style={{ background: "#050508", border: "1px solid #1a1a2e" }}
          >
            <input
              type="number"
              min="0"
              step={direction === "buy" ? "0.01" : "1"}
              value={inputAmt}
              onChange={(e) => setInputAmt(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent font-mono text-base text-white focus:outline-none"
              style={{ fontFamily: "var(--font-mono)" }}
            />
            <span className="font-mono text-xs font-bold text-accent">
              {direction === "buy" ? "SOL" : TOKEN_SYMBOL}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div
            className="w-7 h-7 rounded border flex items-center justify-center text-accent"
            style={{ borderColor: "#00ff8840" }}
          >
            ↓
          </div>
        </div>

        {/* Output */}
        <div>
          <span className="font-mono text-xs text-muted uppercase block mb-1">
            {direction === "buy" ? `You Receive (${TOKEN_SYMBOL})` : "You Receive (SOL)"}
          </span>
          <div
            className="flex items-center rounded px-3 py-2 gap-2"
            style={{ background: "#050508", border: "1px solid #1a1a2e" }}
          >
            <span className="flex-1 font-mono text-base text-accent num-live">
              {amountOut.gt(0)
                ? direction === "buy"
                  ? amountOut.toFixed(2)
                  : amountOut.toFixed(6)
                : "—"}
            </span>
            <span className="font-mono text-xs font-bold text-accent">
              {direction === "buy" ? TOKEN_SYMBOL : "SOL"}
            </span>
          </div>
        </div>

        {/* Quote details */}
        {amountOut.gt(0) && (
          <div
            className="rounded p-3 space-y-1.5"
            style={{ background: "#050508", border: "1px solid #1a1a2e" }}
          >
            <Row
              label="Price Impact"
              value={`${priceImpact.toFixed(3)}%`}
              valueClass={impactColor}
            />
            <Row
              label="New Pool Price"
              value={`${newPrice.toFixed(9)} SOL`}
            />
            <Row
              label="Slippage Tolerance"
              value={`${slippage}%`}
            />
            <Row
              label="Protocol Fee"
              value="0.25% (Raydium)"
            />
          </div>
        )}

        {/* Swap button */}
        {connected ? (
          <button
            onClick={handleSwap}
            disabled={loading || !inputAmt || parseFloat(inputAmt) <= 0}
            className={`w-full py-3 rounded font-display text-sm font-bold tracking-widest transition-all ${
              loading
                ? "opacity-50 cursor-wait"
                : "hover:opacity-90 active:scale-[0.99]"
            }`}
            style={{
              background: direction === "buy"
                ? "linear-gradient(135deg, #00ff88, #00cc66)"
                : "linear-gradient(135deg, #ef4444, #b91c1c)",
              color:      "#050508",
              boxShadow:  loading
                ? "none"
                : direction === "buy"
                  ? "0 4px 24px #00ff8840"
                  : "0 4px 24px #ef444440",
            }}
          >
            {loading ? "PROCESSING..." : direction === "buy" ? "◆ BUY NOW" : "◇ SELL NOW"}
          </button>
        ) : (
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        )}

        {/* Status messages */}
        {error && (
          <div
            className="rounded p-3 font-mono text-xs text-red-400"
            style={{ background: "#ef444410", border: "1px solid #ef444430" }}
          >
            ❌ {error}
          </div>
        )}

        {txSignature && (
          <div
            className="rounded p-3 font-mono text-xs text-accent"
            style={{ background: "#00ff8810", border: "1px solid #00ff8830" }}
          >
            <p className="font-bold mb-1">✅ Swap executed!</p>
            {lastSwap && (
              <p className="text-muted">
                {lastSwap.direction === "buy" ? "Bought" : "Sold"}{" "}
                {lastSwap.amountIn} → {lastSwap.amountOut}
              </p>
            )}
            <p className="text-muted mt-1 break-all">
              TX: {txSignature.startsWith("DEMO_") ? (
                <span className="text-gold">{txSignature} (demo mode)</span>
              ) : (
                <a
                  href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-white"
                >
                  {txSignature.slice(0, 20)}...
                </a>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="font-mono text-xs text-muted">{label}</span>
      <span className={`font-mono text-xs ${valueClass}`}>{value}</span>
    </div>
  );
}
