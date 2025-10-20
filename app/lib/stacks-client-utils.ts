"use client";

import { request } from "@stacks/connect";
import type { ClarityValue } from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";

const NETWORK_ENV =
  (process.env.NEXT_PUBLIC_STACKS_NETWORK as "testnet" | "mainnet") ||
  "testnet";

export const STACKS_NETWORK =
  NETWORK_ENV === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET;

// Contract addresses from environment variables
export const CONTRACTS = {
  BTCUNI_MAIN: process.env.NEXT_PUBLIC_BTCUNI_CONTRACT_ADDRESS!,
  BTCUNI_NFT: process.env.NEXT_PUBLIC_BTCUNI_NFT_CONTRACT_ADDRESS!,
  SBTC_TOKEN: process.env.NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS!,
  DIA_ORACLE: process.env.NEXT_PUBLIC_DIA_ORACLE_CONTRACT_ADDRESS!,
};

export const CONTRACT_NAMES = {
  BTCUNI_MAIN: process.env.NEXT_PUBLIC_BTCUNI_CONTRACT_NAME!,
  BTCUNI_NFT: process.env.NEXT_PUBLIC_BTCUNI_NFT_CONTRACT_NAME!,
  SBTC_TOKEN: process.env.NEXT_PUBLIC_SBTC_CONTRACT_NAME!,
  DIA_ORACLE: process.env.NEXT_PUBLIC_DIA_ORACLE_CONTRACT_NAME!,
};

interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  userAddress: string;
  postConditionMode?: "allow" | "deny";
}

// Sign and broadcast contract call using @stacks/connect v8 RPC API
export async function callContract(
  params: ContractCallParams
): Promise<string> {
  try {
    const contractId =
      `${params.contractAddress}.${params.contractName}` as `${string}.${string}`;

    const res = await request("stx_callContract", {
      contract: contractId,
      functionName: params.functionName,
      functionArgs: params.functionArgs,
      address: params.userAddress,
      network: NETWORK_ENV,
      postConditionMode: params.postConditionMode || "allow",
    });

    const txid = (res as any)?.txid || (res as any)?.transaction;
    if (!txid) throw new Error("No transaction ID returned");

    console.log("🎉 Transaction broadcast successful:", txid);
    console.log(
      "🔗 View on explorer:",
      `https://explorer.hiro.so/txid/${txid}?chain=${NETWORK_ENV}`
    );

    return txid as string;
  } catch (error) {
    console.error("❌ Transaction failed:", error);
    throw error;
  }
}

// Read-only contract calls
export async function readContract(params: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
}): Promise<any> {
  try {
    const { fetchCallReadOnlyFunction, cvToValue } = await import(
      "@stacks/transactions"
    );

    const result = await fetchCallReadOnlyFunction({
      contractAddress: params.contractAddress,
      contractName: params.contractName,
      functionName: params.functionName,
      functionArgs: params.functionArgs,
      senderAddress: params.senderAddress,
      network: STACKS_NETWORK,
    });

    return cvToValue(result);
  } catch (error) {
    console.error("❌ Read contract call failed:", error);
    throw error;
  }
}

// Legacy wrapper for backward compatibility
export function openContractCallTx(
  params: Omit<ContractCallParams, "userAddress">,
  onFinish?: (data: any) => void,
  onCancel?: () => void
): Promise<void> {
  console.warn("openContractCallTx is deprecated. Use callContract instead.");
  return Promise.resolve();
}
