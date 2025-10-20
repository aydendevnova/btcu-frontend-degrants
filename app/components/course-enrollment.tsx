"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/app/providers";
import { uintCV } from "@stacks/transactions";
import { CheckCircle, Lock, Trophy } from "lucide-react";
import {
  callContract,
  readContract,
  CONTRACTS,
  CONTRACT_NAMES,
} from "@/app/lib/stacks-client-utils";
import { Cl } from "@stacks/transactions";

interface Course {
  id: number;
  title: string;
  description: string;
  emoji: string;
  price: string;
}

const COURSES: Course[] = [
  {
    id: 1,
    title: "Start with Bitcoin",
    description:
      "Learn what Bitcoin is, how it works, and how to use it safely — even if you're brand new.",
    emoji: "💰",
    price: "0.01 sBTC",
  },
  {
    id: 2,
    title: "Easy Bitcoin & Stacks",
    description:
      "A simple guide to understanding Bitcoin and the Stacks network — no tech skills needed!",
    emoji: "⚡",
    price: "0.01 sBTC",
  },
  {
    id: 3,
    title: "Bitcoin Made Simple",
    description:
      "Understand Bitcoin in plain language — how to buy, store, and use it with confidence.",
    emoji: "🔗",
    price: "0.01 sBTC",
  },
  {
    id: 4,
    title: "Intro to Stacks: Apps on Bitcoin",
    description:
      "Discover how people are building cool apps on Bitcoin using Stacks — explained step by step.",
    emoji: "🚀",
    price: "0.01 sBTC",
  },
  {
    id: 5,
    title: "From Zero to Bitcoin Hero",
    description:
      "Start from zero and learn the basics of Bitcoin, wallets, and how to join the new digital world.",
    emoji: "🧠",
    price: "0.01 sBTC",
  },
];

interface CourseEnrollmentProps {
  onEnrollmentComplete?: () => void;
}

export default function CourseEnrollment({
  onEnrollmentComplete,
}: CourseEnrollmentProps) {
  const { userAddress } = useWallet();
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [checkingWhitelist, setCheckingWhitelist] = useState(false);
  const [enrollingWhitelist, setEnrollingWhitelist] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState<number | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Set<number>>(
    new Set()
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Check whitelist status
  useEffect(() => {
    if (!userAddress) return;

    const checkWhitelist = async () => {
      setCheckingWhitelist(true);
      try {
        const result = await readContract({
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: CONTRACT_NAMES.BTCUNI_MAIN,
          functionName: "is-whitelisted-beta",
          functionArgs: [Cl.principal(userAddress)],
          senderAddress: userAddress,
        });
        setIsWhitelisted(result?.value === true);
      } catch (err) {
        console.error("Failed to check whitelist:", err);
      } finally {
        setCheckingWhitelist(false);
      }
    };

    checkWhitelist();
  }, [userAddress]);

  // Check enrollment status for all courses
  useEffect(() => {
    const checkEnrollments = async () => {
      if (!userAddress) return;

      try {
        const result = await readContract({
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: CONTRACT_NAMES.BTCUNI_MAIN,
          functionName: "get-enrolled-ids",
          functionArgs: [Cl.principal(userAddress)],
          senderAddress: userAddress,
        });

        if (result?.value && Array.isArray(result.value)) {
          const enrolled = new Set<number>(
            result.value.map((id: any) => Number(id))
          );
          setEnrolledCourses(enrolled);
        }
      } catch (err) {
        console.error("Enrollment check failed:", err);
      }
    };

    if (isWhitelisted) {
      checkEnrollments();
    }
  }, [userAddress, isWhitelisted]);

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
        message: "Whitelist enrollment successful! Transaction: " + txId,
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

  const handleEnrollCourse = async (courseId: number) => {
    if (!userAddress) {
      setToast({ type: "error", message: "Wallet not connected" });
      return;
    }

    if (!isWhitelisted) {
      setToast({ type: "error", message: "You must be whitelisted first" });
      return;
    }

    setEnrollingCourse(courseId);
    try {
      const txId = await callContract({
        contractAddress: CONTRACTS.BTCUNI_MAIN,
        contractName: CONTRACT_NAMES.BTCUNI_MAIN,
        functionName: "enroll-course",
        functionArgs: [uintCV(courseId)],
        userAddress,
      });

      setToast({
        type: "success",
        message: `Course enrollment successful! Transaction: ${txId}`,
      });
      setEnrolledCourses((prev) => new Set(prev).add(courseId));
      onEnrollmentComplete?.();
    } catch (err) {
      console.error("Course enrollment error:", err);
      const message =
        err instanceof Error ? err.message : "Course enrollment failed";
      setToast({ type: "error", message });
    } finally {
      setEnrollingCourse(null);
    }
  };

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <section className="bg-gradient-to-b from-yellow-50 via-white to-orange-50 py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
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

        {/* Whitelist Section */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            Enroll in Courses
          </h2>
          <p className="text-gray-700 text-lg md:text-xl">
            Join the whitelist to start learning and earning
          </p>

          {!isWhitelisted && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-6 max-w-2xl mx-auto"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                🔐 Join the Whitelist
              </h3>
              <p className="text-gray-700 mb-4">
                You need to hold at least 10 USD worth of sBTC to join
              </p>
              <button
                onClick={handleEnrollWhitelist}
                disabled={enrollingWhitelist || checkingWhitelist}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {enrollingWhitelist ? "Enrolling..." : "Join Whitelist"}
              </button>
            </motion.div>
          )}

          {isWhitelisted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-100 border-2 border-green-300 rounded-2xl p-6 max-w-2xl mx-auto"
            >
              <h3 className="text-2xl font-bold text-green-900 mb-2 flex items-center justify-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Whitelisted!
              </h3>
              <p className="text-green-800">You can now enroll in courses</p>
            </motion.div>
          )}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {COURSES.map((course) => {
            const isEnrolled = enrolledCourses.has(course.id);
            const isEnrolling = enrollingCourse === course.id;

            return (
              <motion.div
                key={course.id}
                whileHover={{ scale: isWhitelisted ? 1.03 : 1 }}
                className={`relative bg-white rounded-3xl border-2 p-6 shadow-lg transition-all ${
                  isEnrolled
                    ? "border-green-300 bg-green-50"
                    : isWhitelisted
                    ? "border-orange-300 hover:shadow-orange-200"
                    : "border-gray-200 opacity-60"
                }`}
              >
                {!isWhitelisted && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                {isEnrolled && (
                  <div className="absolute top-4 right-4">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                )}

                <div className="text-5xl mb-4">{course.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-gray-700 text-sm mb-4">
                  {course.description}
                </p>
                <p className="text-orange-600 font-semibold mb-4">
                  {course.price}
                </p>

                {isEnrolled ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full px-6 py-3 bg-green-500 text-white rounded-xl font-semibold cursor-default flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Enrolled ✓
                    </button>
                    <button
                      onClick={() => setSelectedCourse(course)}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                    >
                      View Course
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEnrollCourse(course.id)}
                    disabled={!isWhitelisted || isEnrolling}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      isWhitelisted
                        ? "bg-gradient-to-r from-orange-500 to-yellow-400 text-white hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isEnrolling ? "Enrolling..." : "Enroll Now (0.01 sBTC)"}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Course Details Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCourse(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-6xl">{selectedCourse.emoji}</span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {selectedCourse.title}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {selectedCourse.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Enrolled and Active</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 Complete all lessons to earn your NFT certificate!
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-all"
              >
                Close
              </button>
              <button
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                onClick={() => {
                  alert("Course content page coming soon!");
                }}
              >
                Continue Learning →
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
