"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? "TKN";
const NETWORK      = process.env.NEXT_PUBLIC_NETWORK      ?? "devnet";

export function TopBar() {
  const { connected, publicKey } = useWallet();

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{ background: "rgba(5,5,8,0.95)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded border border-accent flex items-center justify-center"
               style={{ boxShadow: "0 0 12px #00ff8840" }}>
            <span className="font-display text-accent text-xs font-bold">
              {TOKEN_SYMBOL.slice(0, 2)}
            </span>
          </div>
          <span className="font-display text-sm font-bold tracking-widest text-white hidden sm:block">
            {TOKEN_SYMBOL}<span className="text-muted">.DEX</span>
          </span>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-6">
          {["SWAP", "POOL", "ANALYTICS"].map((item, i) => (
            <button
              key={item}
              className={`font-mono text-xs tracking-widest transition-colors ${
                i === 0 ? "text-accent" : "text-muted hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
            <span className="font-mono text-xs text-muted uppercase">{NETWORK}</span>
          </div>

          {connected && publicKey ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted hidden sm:block">
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </span>
              <WalletMultiButton />
            </div>
          ) : (
            <WalletMultiButton />
          )}
        </div>
      </div>
    </header>
  );
}
