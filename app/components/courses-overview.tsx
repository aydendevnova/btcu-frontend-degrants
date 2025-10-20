"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BookOpen, Award, Users, Zap, ArrowRight } from "lucide-react";
import { useWallet } from "@/app/providers";
import {
  readContract,
  CONTRACTS,
  CONTRACT_NAMES,
} from "@/app/lib/stacks-client-utils";
import { Cl } from "@stacks/transactions";

const COURSES_LIST = [
  {
    id: 1,
    emoji: "💰",
    title: "Start with Bitcoin",
    description:
      "Learn what Bitcoin is, how it works, and how to use it safely — even if you're brand new.",
    duration: "2 hours",
  },
  {
    id: 2,
    emoji: "⚡",
    title: "Easy Bitcoin & Stacks",
    description:
      "A simple guide to understanding Bitcoin and the Stacks network — no tech skills needed!",
    duration: "3 hours",
  },
  {
    id: 3,
    emoji: "🔗",
    title: "Bitcoin Made Simple",
    description:
      "Understand Bitcoin in plain language — how to buy, store, and use it with confidence.",
    duration: "2.5 hours",
  },
  {
    id: 4,
    emoji: "🚀",
    title: "Intro to Stacks: Apps on Bitcoin",
    description:
      "Discover how people are building cool apps on Bitcoin using Stacks — explained step by step.",
    duration: "4 hours",
  },
  {
    id: 5,
    emoji: "🧠",
    title: "From Zero to Bitcoin Hero",
    description:
      "Start from zero and learn the basics of Bitcoin, wallets, and how to join the new digital world.",
    duration: "5 hours",
  },
];

export default function CoursesOverview() {
  const router = useRouter();
  const { userAddress, isConnected } = useWallet();
  const [enrolledCourses, setEnrolledCourses] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);

  // Check enrollments
  useEffect(() => {
    if (!userAddress) return;

    const checkEnrollments = async () => {
      setLoading(true);
      try {
        const whitelistResult = await readContract({
          contractAddress: CONTRACTS.BTCUNI_MAIN,
          contractName: CONTRACT_NAMES.BTCUNI_MAIN,
          functionName: "is-whitelisted-beta",
          functionArgs: [Cl.principal(userAddress)],
          senderAddress: userAddress,
        });

        if (whitelistResult?.value === true) {
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
      } finally {
        setLoading(false);
      }
    };

    checkEnrollments();
  }, [userAddress]);

  const enrolledCoursesList = COURSES_LIST.filter((course) =>
    enrolledCourses.has(course.id)
  );
  const availableCoursesList = COURSES_LIST.filter(
    (course) => !enrolledCourses.has(course.id)
  );

  return (
    <section className="bg-gradient-to-b from-white via-orange-50 to-yellow-50 py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Bitcoin Courses
            </h2>
            <p className="text-gray-700 text-lg md:text-xl mt-4">
              Choose from our curated Bitcoin and Stacks courses
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-md text-center"
          >
            <BookOpen className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              {COURSES_LIST.length}
            </div>
            <div className="text-sm text-gray-600">Courses</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 border-2 border-yellow-200 shadow-md text-center"
          >
            <Users className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900">1000+</div>
            <div className="text-sm text-gray-600">Students</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-md text-center"
          >
            <Award className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900">NFT</div>
            <div className="text-sm text-gray-600">Certificates</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-md text-center"
          >
            <Zap className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <div className="text-3xl font-bold text-gray-900">
              {enrolledCourses.size}
            </div>
            <div className="text-sm text-gray-600">Enrolled</div>
          </motion.div>
        </div>

        {/* Enrolled Courses Section */}
        {enrolledCoursesList.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-bold text-gray-900">
                Your Enrolled Courses
              </h3>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCoursesList.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl border-2 border-orange-300 p-6 shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-5xl">{course.emoji}</div>
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      Enrolled
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-orange-600 font-semibold">
                      {course.duration}
                    </span>
                    <span className="text-green-600 font-semibold">
                      0.01 sBTC
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/course/${course.id}`)}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    View Course
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Available Courses Section */}
        {availableCoursesList.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-900">
              Available Courses
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCoursesList.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: (index + enrolledCoursesList.length) * 0.1,
                    duration: 0.5,
                  }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="bg-white rounded-3xl border-2 border-orange-200 p-6 shadow-lg hover:shadow-2xl hover:shadow-orange-100 transition-all cursor-pointer"
                  onClick={() =>
                    isConnected
                      ? router.push(`/course/${course.id}`)
                      : router.push("/dashboard")
                  }
                >
                  <div className="text-5xl mb-4">{course.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-600 font-semibold">
                      {course.duration}
                    </span>
                    <span className="text-green-600 font-semibold">
                      0.01 sBTC
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/dashboard")}
            className="px-12 py-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            {isConnected ? "Go to Dashboard 🚀" : "Start Learning Today 🚀"}
          </motion.button>
        </div>
      </div>
    </section>
  );
}
