"use client";

import React from "react";
import { useWallet } from "@/app/providers";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";

export default function Header() {
  const { disconnect, userAddress, isConnected } = useWallet();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => router.push("/dashboard")}
      >
        <Image
          src="/btcu-logo.png"
          alt="Bitcoin University"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Bitcoin University
          </h1>
          <p className="text-xs text-gray-500">Powered by Stacks</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isConnected && userAddress && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-mono text-green-900">
              {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </span>
          </div>
        )}
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            disconnect();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Disconnect</span>
        </button>
      </div>
    </div>
  );
}
