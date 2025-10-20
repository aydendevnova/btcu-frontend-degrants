"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/app/providers";
import { useRouter } from "next/navigation";
import { fetchCallReadOnlyFunction, cvToValue, Cl } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import {
  ArrowUpRight,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  callContract,
  readContract,
  CONTRACTS,
  CONTRACT_NAMES,
} from "@/app/lib/stacks-client-utils";

// Import components
import Header from "../components/header";
import WalletDisplay from "../components/displayWallet";
import Balance from "../components/balance";

const COURSES = [
  {
    id: 1,
    title: "Start with Bitcoin",
    description:
      "Learn what Bitcoin is, how it works, and how to use it safely",
    emoji: "💰",
    price: "0.01 sBTC",
    duration: "2 hours",
  },
  {
    id: 2,
    title: "Easy Bitcoin & Stacks",
    description:
      "A simple guide to understanding Bitcoin and the Stacks network",
    emoji: "⚡",
    price: "0.01 sBTC",
    duration: "3 hours",
  },
  {
    id: 3,
    title: "Bitcoin Made Simple",
    description:
      "Understand Bitcoin in plain language — how to buy, store, and use it",
    emoji: "🔗",
    price: "0.01 sBTC",
    duration: "2.5 hours",
  },
  {
    id: 4,
    title: "Intro to Stacks: Apps on Bitcoin",
    description:
      "Discover how people are building cool apps on Bitcoin using Stacks",
    emoji: "🚀",
    price: "0.01 sBTC",
    duration: "4 hours",
  },
  {
    id: 5,
    title: "From Zero to Bitcoin Hero",
    description:
      "Start from zero and learn the basics of Bitcoin, wallets, and more",
    emoji: "🧠",
    price: "0.01 sBTC",
    duration: "5 hours",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, userAddress } = useWallet();
  const [stxBalance, setStxBalance] = useState<bigint>(0n);
  const [sbtcBalance, setSbtcBalance] = useState<bigint>(0n);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Set<number>>(
    new Set()
  );
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [showWalletActions, setShowWalletActions] = useState(false);
  const [enrollingWhitelist, setEnrollingWhitelist] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  // Fetch STX and sBTC balances
  useEffect(() => {
    if (!userAddress) return;

    const fetchBalances = async () => {
      setLoadingBalance(true);
      try {
        const stxRes = await fetch(
          `https://api.testnet.hiro.so/extended/v1/address/${userAddress}/balances?unanchored=true`
        );
        if (!stxRes.ok) throw new Error("Failed to fetch STX balance");
        const stxData = await stxRes.json();
        setStxBalance(BigInt(stxData.stx?.balance || "0"));

        const sbtcContractAddress =
          process.env.NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS!;
        const sbtcContractName = process.env.NEXT_PUBLIC_SBTC_CONTRACT_NAME!;

        const sbtcCv = await fetchCallReadOnlyFunction({
          contractAddress: sbtcContractAddress,
          contractName: sbtcContractName,
          functionName: "get-balance-available",
          functionArgs: [Cl.principal(userAddress)],
          senderAddress: userAddress,
          network: STACKS_TESTNET,
        });

        const sbtcValue = cvToValue(sbtcCv) as any;
        const balance = sbtcValue?.value || 0;
        setSbtcBalance(BigInt(balance));
      } catch (err) {
        console.error("Error fetching balances:", err);
        setStxBalance(0n);
        setSbtcBalance(0n);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalances();
  }, [userAddress]);

  // Check whitelist and enrollments
  useEffect(() => {
    if (!userAddress) return;

    const checkStatus = async () => {
      try {
        const whitelistResult = await readContract({
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: CONTRACT_NAMES.BTCUNI_MAIN,
          functionName: "is-whitelisted-beta",
          functionArgs: [Cl.principal(userAddress)],
          senderAddress: userAddress,
        });

        const isWhiteListed = whitelistResult?.value === true;
        setIsWhitelisted(isWhiteListed);

        if (isWhiteListed) {
          const enrollResult = await readContract({
            contractAddress: CONTRACTS.BTCUNI_MAIN,
            contractName: CONTRACT_NAMES.BTCUNI_MAIN,
            functionName: "get-enrolled-ids",
            functionArgs: [Cl.principal(userAddress)],
            senderAddress: userAddress,
          });

          if (enrollResult?.value && Array.isArray(enrollResult.value)) {
            setEnrolledCourses(
              new Set<number>(enrollResult.value.map((id: any) => Number(id)))
            );
          }
        }
      } catch (err) {
        console.error("Status check failed:", err);
      }
    };

    checkStatus();
  }, [userAddress]);

  const handleEnrollWhitelist = async () => {
    if (!userAddress) {
      setToast({ type: "error", message: "Wallet not connected" });
      return;
    }

    setEnrollingWhitelist(true);
    try {
      const txId = await callContract({
        contractAddress: CONTRACTS.BTCUNI_MAIN,
        contractName: CONTRACT_NAMES.BTCUNI_MAIN,
        functionName: "enroll-whitelist",
        functionArgs: [],
        userAddress,
      });

      setToast({
        type: "success",
        message:
          "Whitelist enrollment successful! Transaction: " +
          txId.slice(0, 16) +
          "...",
      });
      setIsWhitelisted(true);
    } catch (err) {
      console.error("Whitelist enrollment error:", err);
      const message =
        err instanceof Error ? err.message : "Whitelist enrollment failed";
      setToast({ type: "error", message });
    } finally {
      setEnrollingWhitelist(false);
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!isConnected) return null;

  const balanceInStx = Number(stxBalance) / 1_000_000;
  const balanceInSbtc = Number(sbtcBalance) / 100_000_000;
  const totalValueUSD = balanceInStx * 0.5 + balanceInSbtc * 95000; // Mock USD values

  return (
    <div className="min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold max-w-md ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </motion.div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Header />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Portfolio Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-8 text-white"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-orange-100 text-sm mb-2">Total Balance</p>
                <h2 className="text-5xl font-bold">
                  ${totalValueUSD.toFixed(2)}
                </h2>
                <p className="text-orange-100 text-sm mt-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  +0.00% (24h)
                </p>
              </div>
              <button
                onClick={() => setShowWalletActions(!showWalletActions)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
              >
                View Wallet
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 text-sm">STX</p>
                    <p className="text-2xl font-bold mt-1">
                      {loadingBalance ? "..." : balanceInStx.toFixed(6)}
                    </p>
                  </div>
                  <img src="/stx.png" alt="STX" className="w-10 h-10" />
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 text-sm">sBTC</p>
                    <p className="text-2xl font-bold mt-1">
                      {loadingBalance ? "..." : balanceInSbtc.toFixed(8)}
                    </p>
                  </div>
                  <img src="/sbtc.avif" alt="sBTC" className="w-10 h-10" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Wallet Actions Expandable */}
          {showWalletActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 bg-gray-50 rounded-2xl p-6"
            >
              <WalletDisplay stxwallet={userAddress || ""} />
              <Balance stxBalance={stxBalance} sbtcBalance={sbtcBalance} />
            </motion.div>
          )}

          {/* Whitelist Status */}
          {!isWhitelisted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-orange-300 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Lock className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Join the Whitelist
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You need to hold at least 10 USD worth of sBTC to enroll in
                    courses. Join the whitelist to unlock all course content and
                    start your Bitcoin learning journey.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Access to all courses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Earn NFT certificates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Track your progress on-chain</span>
                  </div>
                  <button
                    onClick={handleEnrollWhitelist}
                    disabled={enrollingWhitelist}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrollingWhitelist ? "Enrolling..." : "Join Whitelist"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 p-6"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900">
                    Whitelisted! 🎉
                  </h3>
                  <p className="text-sm text-green-700">
                    You can now enroll in courses and earn certificates
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Learning Progress */}
          {isWhitelisted && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <GraduationCap className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Your Learning Journey
                    </h3>
                    <p className="text-sm text-gray-600">
                      {enrolledCourses.size} of {COURSES.length} courses
                      enrolled
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>
                    {Math.round((enrolledCourses.size / COURSES.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (enrolledCourses.size / COURSES.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Courses Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Available Courses
              </h3>
              <button className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1">
                View All
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {COURSES.map((course) => {
                const isEnrolled = enrolledCourses.has(course.id);

                return (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -4 }}
                    onClick={() => router.push(`/course/${course.id}`)}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gray-100 group-hover:bg-orange-100 transition-colors p-3 rounded-xl text-2xl">
                        {course.emoji}
                      </div>
                      {isEnrolled && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Enrolled
                        </div>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                      {course.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {isEnrolled ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/course/${course.id}`);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        View Course
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{course.duration}</span>
                        <span className="font-semibold text-orange-600">
                          {course.price}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
