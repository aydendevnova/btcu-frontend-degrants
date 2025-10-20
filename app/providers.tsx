"use client";

import { request } from "@stacks/connect";
import React, { createContext, useContext, useEffect, useState } from "react";

interface WalletContextType {
  isConnected: boolean;
  userAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

const WALLET_ADDRESS_KEY = "btcu-wallet-address";
const NETWORK = "testnet";

function pickAddressForNetwork(addresses: any[]): string | null {
  console.log("[pickAddressForNetwork] Called with:", addresses);
  console.log("[pickAddressForNetwork] Target network:", NETWORK);
  console.log("[pickAddressForNetwork] Is array?", Array.isArray(addresses));

  if (!Array.isArray(addresses)) {
    console.log("[pickAddressForNetwork] Not an array, returning null");
    return null;
  }

  console.log(
    "[pickAddressForNetwork] Processing",
    addresses.length,
    "addresses"
  );

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    console.log(`[pickAddressForNetwork] Processing address ${i}:`, addr);

    if (!addr) {
      console.log(
        `[pickAddressForNetwork] Address ${i} is null/undefined, skipping`
      );
      continue;
    }

    const stacksAddr = addr.address || addr.stxAddress || addr;
    console.log(`[pickAddressForNetwork] Extracted stacksAddr:`, stacksAddr);
    console.log(`[pickAddressForNetwork] stacksAddr type:`, typeof stacksAddr);

    if (typeof stacksAddr === "string") {
      console.log(
        `[pickAddressForNetwork] Testing if matches testnet pattern (ST...):`,
        stacksAddr
      );
      const matches = /^ST[0-9A-Z]{39}$/.test(stacksAddr);
      console.log(`[pickAddressForNetwork] Pattern match result:`, matches);

      if (matches) {
        if (addr.network) {
          console.log(
            `[pickAddressForNetwork] Address has network property:`,
            addr.network
          );
          if (addr.network !== NETWORK) {
            console.log(`[pickAddressForNetwork] Network mismatch, skipping`);
            continue;
          }
        }
        console.log(
          `[pickAddressForNetwork] ✓ Found valid address:`,
          stacksAddr
        );
        return stacksAddr;
      }
    }

    if (typeof addr === "object" && addr.stxAddress) {
      console.log(
        `[pickAddressForNetwork] Checking nested stxAddress structure:`,
        addr.stxAddress
      );
      const nestedAddr = addr.stxAddress[NETWORK] || addr.stxAddress.testnet;
      console.log(
        `[pickAddressForNetwork] Nested address for ${NETWORK}:`,
        nestedAddr
      );

      if (
        typeof nestedAddr === "string" &&
        /^ST[0-9A-Z]{39}$/.test(nestedAddr)
      ) {
        console.log(
          `[pickAddressForNetwork] ✓ Found valid nested address:`,
          nestedAddr
        );
        return nestedAddr;
      }
    }
  }

  console.log(
    "[pickAddressForNetwork] ✗ No valid address found, returning null"
  );
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Log state changes
  useEffect(() => {
    console.log(
      "[Providers] State changed - isConnected:",
      isConnected,
      "userAddress:",
      userAddress
    );
  }, [isConnected, userAddress]);

  useEffect(() => {
    console.log("[Providers] Initializing, checking for saved address...");
    const savedAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
    console.log("[Providers] Saved address from localStorage:", savedAddress);

    if (savedAddress) {
      console.log("[Providers] Restoring saved wallet connection");
      setUserAddress(savedAddress);
      setIsConnected(true);
    } else {
      console.log("[Providers] No saved address found");
    }
  }, []);

  async function connect() {
    console.log("[Providers] connect() called");
    console.log(
      "[Providers] Current state - isConnected:",
      isConnected,
      "userAddress:",
      userAddress
    );

    try {
      console.log("[Providers] Calling request('stx_getAddresses')...");
      const res = await request("stx_getAddresses");
      console.log("[Providers] Raw response from stx_getAddresses:", res);
      console.log("[Providers] Response type:", typeof res);
      console.log("[Providers] Response addresses:", (res as any)?.addresses);

      const addresses = (res as any)?.addresses;
      if (!addresses) {
        console.error("[Providers] No addresses array in response!");
        throw new Error("No addresses returned from wallet");
      }

      console.log("[Providers] Addresses array length:", addresses.length);
      console.log(
        "[Providers] Calling pickAddressForNetwork with addresses:",
        addresses
      );

      const address = pickAddressForNetwork(addresses);
      console.log("[Providers] Picked address:", address);

      if (!address) {
        console.error("[Providers] pickAddressForNetwork returned null!");
        throw new Error("No wallet address available");
      }

      console.log("[Providers] Setting state - address:", address);
      setUserAddress(address);
      setIsConnected(true);

      console.log("[Providers] Saving to localStorage...");
      localStorage.setItem(WALLET_ADDRESS_KEY, address);
      console.log("[Providers] Successfully saved to localStorage");

      console.log("[Providers] Connection successful!");
    } catch (error) {
      console.error("[Providers] Connection failed with error:", error);
      console.error("[Providers] Error type:", typeof error);
      console.error("[Providers] Error details:", error);
      throw error;
    }
  }

  function disconnect() {
    console.log("[Providers] disconnect() called");
    setUserAddress(null);
    setIsConnected(false);
    localStorage.removeItem(WALLET_ADDRESS_KEY);
    console.log("[Providers] Disconnected, redirecting to home");
    window.location.href = "/";
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        userAddress,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
