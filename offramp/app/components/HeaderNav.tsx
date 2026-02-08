"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export type ViewKey = "pref" | "search" | "alts" | "detail";

type Props = {
  onNavigate?: (view: ViewKey) => void;
  onLogin?: () => void;
  onSearch?: () => void;
};

export function HeaderNav({ onLogin, onSearch }: Props) {
  return (
    <motion.header
      className="flex items-center justify-between gap-6 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-black/5"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-12 items-center gap-2 overflow-hidden rounded-full bg-white px-3 py-2 hover:shadow-sm"
          aria-label="Go to preferences home"
        >
          <Image
            src="/offramp-logo.svg"
            alt="OffRamp logo"
            width={40}
            height={40}
            priority
            className="rounded-lg"
          />
          <h5 className="font-mono text-2xl font-bold text-green-600 hover:text-green-700">OffRamp</h5>
        </Link>
        <div>
          <Link href="/whatsapp" className="text-md text-pink-400 hover:text-pink-500 hover:underline">
            WhatsApp Assistant
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-[#f3f5f4] px-3 py-2 ring-1 ring-transparent transition hover:ring-[#dfe6e0]">
          <span className="text-gray-400">🔍</span>
          <input
            className="w-40 border-none bg-transparent text-sm text-gray-700 outline-none"
            placeholder="Search dishes..."
            onFocus={onSearch}
            onClick={onSearch}
          />
        </div>
        <Link
          href="/profile"
          className="rounded-full bg-[#2f6b4a] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
        >
          Profile
        </Link>
      </div>
    </motion.header>
  );
}
