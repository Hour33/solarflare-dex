"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import Decimal from "decimal.js";

const TOKEN_MINT     = process.env.NEXT_PUBLIC_TOKEN_MINT     ?? "";
const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? "6");
const TOKEN_SYMBOL   = process.env.NEXT_PUBLIC_TOKEN_SYMBOL   ?? "TKN";

export interface TokenBalance {
  sol:          Decimal;
  token:        Decimal;
  solFormatted: string;
  tknFormatted: string;
  loading:      boolean;
  error:        string | null;
}

export function useTokenBalance() {
  const { connection }            = useConnection();
  const { publicKey, connected }  = useWallet();

  const [balance, setBalance] = useState<TokenBalance>({
    sol:          new Decimal(0),
    token:        new Decimal(0),
    solFormatted: "0.0000",
    tknFormatted: "0",
    loading:      false,
    error:        null,
  });

  const fetch = useCallback(async () => {
    if (!publicKey || !connected) return;

    setBalance((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch SOL balance
      const lamports    = await connection.getBalance(publicKey);
      const solBalance  = new Decimal(lamports).div(LAMPORTS_PER_SOL);

      // Fetch token balance
      let tokenBalance = new Decimal(0);

      if (TOKEN_MINT) {
        try {
          const mintPk  = new PublicKey(TOKEN_MINT);
          const ata     = getAssociatedTokenAddressSync(mintPk, publicKey, false, TOKEN_PROGRAM_ID);
          const account = await getAccount(connection, ata);
          tokenBalance  = new Decimal(account.amount.toString())
            .div(Decimal.pow(10, TOKEN_DECIMALS));
        } catch {
          // ATA doesn't exist yet → 0 balance
        }
      }

      setBalance({
        sol:          solBalance,
        token:        tokenBalance,
        solFormatted: solBalance.toFixed(4),
        tknFormatted: tokenBalance.toNumber().toLocaleString("en-US", { maximumFractionDigits: 2 }),
        loading:      false,
        error:        null,
      });
    } catch (err: any) {
      setBalance((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [publicKey, connected, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      fetch();
      const id = setInterval(fetch, 10000);
      return () => clearInterval(id);
    }
  }, [connected, publicKey, fetch]);

  return { ...balance, refresh: fetch, symbol: TOKEN_SYMBOL };
}
