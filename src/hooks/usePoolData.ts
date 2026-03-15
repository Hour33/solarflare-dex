"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import Decimal from "decimal.js";

const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? "6");

export interface PoolData {
  price:          Decimal;
  priceUSD:       Decimal;
  solReserve:     Decimal;
  tokenReserve:   Decimal;
  priceChange24h: number;
  tvlSOL:         Decimal;
  loading:        boolean;
  error:          string | null;
  lastUpdated:    Date | null;
}

export interface PricePoint {
  time:  number;
  price: number;
  sol:   number;
}

const POOL_ID    = process.env.NEXT_PUBLIC_POOL_ID    ?? "";
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT ?? "";

// SOL/USD mock price (replace with CoinGecko or Pyth in production)
const SOL_USD_PRICE = new Decimal(145);

export function usePoolData() {
  const { connection } = useConnection();

  const [data, setData] = useState<PoolData>({
    price:          new Decimal(0.000003),
    priceUSD:       new Decimal(0),
    solReserve:     new Decimal(1.5),
    tokenReserve:   new Decimal(500000),
    priceChange24h: 0,
    tvlSOL:         new Decimal(3),
    loading:        true,
    error:          null,
    lastUpdated:    null,
  });

  const [priceHistory, setPriceHistory] = useState<PricePoint[]>(() => {
    // Seed mock history
    const now = Date.now();
    const base = 0.000003;
    return Array.from({ length: 30 }, (_, i) => ({
      time:  now - (30 - i) * 60000,
      price: base * (1 + (Math.random() - 0.5) * 0.1),
      sol:   1.5 - i * 0.01,
    }));
  });

  const prevPriceRef = useRef<Decimal>(new Decimal(0.000003));
  const intervalRef  = useRef<NodeJS.Timeout | null>(null);

  const fetchPoolData = useCallback(async () => {
    if (!POOL_ID || !TOKEN_MINT) {
      // Demo mode — simulate price movement
      setData((prev) => {
        const drift    = (Math.random() - 0.49) * 0.0000001;
        const newPrice = Decimal.max(prev.price.plus(drift), new Decimal(0.0000001));
        const change   = newPrice.minus(prevPriceRef.current)
          .div(prevPriceRef.current)
          .mul(100)
          .toNumber();

        return {
          ...prev,
          price:       newPrice,
          priceUSD:    newPrice.mul(SOL_USD_PRICE),
          loading:     false,
          lastUpdated: new Date(),
          priceChange24h: change,
        };
      });

      setPriceHistory((prev) => [
        ...prev.slice(-59),
        {
          time:  Date.now(),
          price: data.price.toNumber(),
          sol:   data.solReserve.toNumber(),
        },
      ]);
      return;
    }

    // Real pool data fetch from Raydium accounts
    try {
      // Raydium AMM accounts store reserves in two vaults.
      // The AMM ID is a state account — we read base/quote vault balances.
      const ammPubkey = new PublicKey(POOL_ID);

      // Fetch AMM state account (Raydium v4 layout)
      const ammAccountInfo = await connection.getAccountInfo(ammPubkey);
      if (!ammAccountInfo) throw new Error("AMM account not found");

      // Raydium AMM V4 layout offsets (bytes):
      // baseVault  @ offset 336
      // quoteVault @ offset 368
      const baseVaultPk  = new PublicKey(ammAccountInfo.data.slice(336, 368));
      const quoteVaultPk = new PublicKey(ammAccountInfo.data.slice(368, 400));

      const [baseVaultAccount, quoteVaultAccount] = await Promise.all([
        getAccount(connection, baseVaultPk),
        getAccount(connection, quoteVaultPk),
      ]);

      const tokenReserve = new Decimal(baseVaultAccount.amount.toString())
        .div(Decimal.pow(10, TOKEN_DECIMALS));
      const solReserve   = new Decimal(quoteVaultAccount.amount.toString())
        .div(Decimal.pow(10, 9));

      const price    = solReserve.div(tokenReserve);
      const priceUSD = price.mul(SOL_USD_PRICE);
      const tvlSOL   = solReserve.mul(2);

      const change = prevPriceRef.current.gt(0)
        ? price.minus(prevPriceRef.current).div(prevPriceRef.current).mul(100).toNumber()
        : 0;

      prevPriceRef.current = price;

      setData({
        price,
        priceUSD,
        solReserve,
        tokenReserve,
        priceChange24h: change,
        tvlSOL,
        loading:        false,
        error:          null,
        lastUpdated:    new Date(),
      });

      setPriceHistory((prev) => [
        ...prev.slice(-59),
        { time: Date.now(), price: price.toNumber(), sol: solReserve.toNumber() },
      ]);
    } catch (err: any) {
      setData((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [connection, data.price, data.solReserve]);

  useEffect(() => {
    fetchPoolData();
    intervalRef.current = setInterval(fetchPoolData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPoolData]);

  return { ...data, priceHistory, refresh: fetchPoolData };
}
