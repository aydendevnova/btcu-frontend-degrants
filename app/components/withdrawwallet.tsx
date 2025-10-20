"use client";

import React, { useState, MouseEvent, useEffect } from "react";
import {
  validateStacksAddress,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  Cl,
} from "@stacks/transactions";
import { ArrowUpRight } from "lucide-react";
import { request } from "@stacks/connect";
import { useWallet } from "@/app/providers";

interface WithdrawSTXProps {
  stxPubKey: string;
  balance: bigint;
}

export default function WithdrawSTX({ stxPubKey, balance }: WithdrawSTXProps) {
  const { userAddress } = useWallet();
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleWithdrawStacks = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setToast(null);

    if (!userAddress) {
      return setToast({ type: "error", message: "Wallet not connected" });
    }

    if (!withdrawAddress || amount <= 0) {
      return setToast({
        type: "error",
        message: "Enter valid recipient and amount",
      });
    }

    if (!validateStacksAddress(withdrawAddress)) {
      return setToast({ type: "error", message: "Invalid STX address" });
    }

    const amountMicro = BigInt(Math.floor(amount * 1_000_000));
    if (amountMicro > balance) {
      return setToast({ type: "error", message: "Insufficient balance" });
    }

    try {
      setWithdrawing(true);

      // Create post condition to ensure exact amount is transferred
      const postCondition = makeStandardSTXPostCondition(
        userAddress,
        FungibleConditionCode.Equal,
        amountMicro
      );

      const result = await request("stx_transferTokens", {
        recipient: withdrawAddress,
        amount: amountMicro.toString(),
        address: userAddress,
        network: "testnet",
        postConditions: [postCondition],
      });

      const txId = (result as any)?.txid || (result as any)?.transaction;

      setToast({
        type: "success",
        message: `Transaction sent! ${
          txId ? `TxID: ${txId.slice(0, 8)}...` : ""
        }`,
      });
      setWithdrawAddress("");
      setAmount(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setToast({ type: "error", message });
    } finally {
      setWithdrawing(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const balanceInSTX = Number(balance) / 1_000_000;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Send STX</h3>

      {toast && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg text-xs font-semibold ${
            toast.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Recipient
          </label>
          <input
            type="text"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            placeholder="STX address"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <button
              onClick={() => setAmount(balanceInSTX)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold hover:bg-orange-200"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {balanceInSTX.toFixed(6)} STX
          </p>
        </div>

        <button
          onClick={handleWithdrawStacks}
          disabled={withdrawing}
          className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-400 hover:shadow-lg disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          {withdrawing ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
