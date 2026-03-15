"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import {
  Raydium,
  TxVersion,
  DEVNET_PROGRAM_ID,
  MAINNET_PROGRAM_ID,
} from "@raydium-io/raydium-sdk-v2";
import { NATIVE_MINT } from "@solana/spl-token";
import Decimal from "decimal.js";

const POOL_ID    = process.env.NEXT_PUBLIC_POOL_ID    ?? "";
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT ?? "";
const NETWORK    = process.env.NEXT_PUBLIC_NETWORK    ?? "devnet";
const TOKEN_DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? "6");

export type SwapDirection = "buy" | "sell";

export interface SwapState {
  loading:     boolean;
  error:       string | null;
  txSignature: string | null;
  lastSwap:    { direction: SwapDirection; amountIn: string; amountOut: string } | null;
}

/** Constant-product AMM output: x * y = k */
export function calcAmountOut(
  amountIn:    Decimal,
  reserveIn:   Decimal,
  reserveOut:  Decimal,
  feePercent = 0.003 // 0.3% Raydium fee
): { amountOut: Decimal; priceImpact: number; newPrice: Decimal } {
  if (amountIn.lte(0) || reserveIn.lte(0) || reserveOut.lte(0)) {
    return { amountOut: new Decimal(0), priceImpact: 0, newPrice: new Decimal(0) };
  }

  const amountInWithFee = amountIn.mul(1 - feePercent);
  const amountOut = reserveOut
    .mul(amountInWithFee)
    .div(reserveIn.plus(amountInWithFee));

  const spotPrice  = reserveIn.div(reserveOut);
  const execPrice  = amountIn.div(amountOut);
  const priceImpact = execPrice.minus(spotPrice).div(spotPrice).mul(100).toNumber();

  const newReserveIn  = reserveIn.plus(amountInWithFee);
  const newReserveOut = reserveOut.minus(amountOut);
  const newPrice      = newReserveIn.div(newReserveOut);

  return { amountOut, priceImpact, newPrice };
}

export function useSwap() {
  const { connection } = useConnection();
  const wallet         = useWallet();

  const [state, setState] = useState<SwapState>({
    loading:     false,
    error:       null,
    txSignature: null,
    lastSwap:    null,
  });

  const executeSwap = useCallback(
    async (
      direction: SwapDirection,
      amountIn: Decimal,
      slippagePct = 0.5
    ): Promise<{ success: boolean; txId?: string; error?: string }> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        return { success: false, error: "Wallet not connected" };
      }

      setState({ loading: true, error: null, txSignature: null, lastSwap: null });

      try {
        // If no pool configured, run as mock (devnet demo)
        if (!POOL_ID || !TOKEN_MINT) {
          // Simulate network delay
          await new Promise((r) => setTimeout(r, 1800));
          const mockOut = amountIn.mul(direction === "buy" ? 200000 : 0.000005);

          setState({
            loading:     false,
            error:       null,
            txSignature: "DEMO_" + Math.random().toString(36).slice(2, 12).toUpperCase(),
            lastSwap: {
              direction,
              amountIn:  amountIn.toString(),
              amountOut: mockOut.toFixed(6),
            },
          });
          return { success: true, txId: "DEMO_TX" };
        }

        // Real Raydium swap via SDK v2
        const raydium = await Raydium.load({
          owner:     wallet as any,
          connection,
          cluster:   NETWORK === "mainnet-beta" ? "mainnet" : "devnet",
          disableFeatureCheck: true,
        });

        const poolKeys = await raydium.liquidity.getAmmPoolKeys(POOL_ID);
        const poolInfo = await raydium.liquidity.getRpcPoolInfo(POOL_ID);

        const inputMint  = direction === "buy"
          ? NATIVE_MINT
          : new PublicKey(TOKEN_MINT);
        const outputMint = direction === "buy"
          ? new PublicKey(TOKEN_MINT)
          : NATIVE_MINT;

        const inputDecimals  = direction === "buy" ? 9 : TOKEN_DECIMALS;
        const rawAmountIn    = BigInt(amountIn.mul(Decimal.pow(10, inputDecimals)).toFixed(0));

        const { execute } = await raydium.liquidity.swap({
          poolInfo,
          poolKeys,
          amountIn:          rawAmountIn,
          amountOutMin:      BigInt(0),  // set real slippage in production
          inputMint,
          fixedSide:         "in",
          txVersion:         TxVersion.V0,
          computeBudgetConfig: {
            units:         400000,
            microLamports: 50000,
          },
        });

        const { txId } = await execute({ sendAndConfirm: true });

        setState({
          loading:     false,
          error:       null,
          txSignature: txId,
          lastSwap: {
            direction,
            amountIn:  amountIn.toString(),
            amountOut: "see tx",
          },
        });
        return { success: true, txId };
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        setState({ loading: false, error: msg, txSignature: null, lastSwap: null });
        return { success: false, error: msg };
      }
    },
    [wallet, connection]
  );

  return { ...state, executeSwap };
}
