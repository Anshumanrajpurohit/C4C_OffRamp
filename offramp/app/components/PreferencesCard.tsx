"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
};

const foodOptions = ["Veg", "Non-Veg", "Jain", "Eggetarian"] as const;
const budgetOptions = ["Low", "Medium", "High"] as const;
const tasteOptions = ["Spicy", "Sweet", "Sour", "Savory", "Bland"] as const;

export function PreferencesCard({ onNext, onBack, onSkip }: Props) {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState("India");
  const [foodPref, setFoodPref] = useState<(typeof foodOptions)[number]>("Veg");
  const [budget, setBudget] = useState<(typeof budgetOptions)[number]>("Medium");
  const [tastes, setTastes] = useState<(typeof tasteOptions)[number][]>(["Spicy"]);

  const toggleTaste = (taste: (typeof tasteOptions)[number]) => {
    setTastes((prev) => (prev.includes(taste) ? prev.filter((t) => t !== taste) : [...prev, taste]));
  };

  const next = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onNext?.();
    }
  };

  const prev = () => {
    if (step > 1) setStep(step - 1);
    else onBack?.();
  };

  return (
    <motion.section
      className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">
          <span>Step {step}</span>
          <span>•</span>
          <span>Preferences</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#2f6b4a]">
          <button onClick={onSkip} className="rounded-full px-3 py-1 hover:bg-[#f0f5f2]">Skip</button>
          <button onClick={prev} className="rounded-full px-3 py-1 hover:bg-[#f0f5f2]" aria-label="Go back">
            Back
          </button>
        </div>
      </div>

      <div className="mb-6 h-2 rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-[#2f6b4a]" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr,1.2fr]">
        <motion.div
          className="flex items-center justify-center rounded-2xl bg-[#f5f7f5] p-8 text-center"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
        >
          <div className="space-y-4">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-5xl shadow-sm">🥗</div>
            <p className="text-lg font-extrabold text-[#1f2c22]">Tell us your preferences</p>
            <p className="text-sm text-gray-500">We will personalize recipes, restaurants, and impact insights for you.</p>
          </div>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-[#1f2c22]">Where are you located?</h2>
              <p className="text-sm text-black">We use this to suggest local ingredients and pricing.</p>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-2xl border-2 border-[#dfe6e0] px-4 py-3 text-sm font-semibold focus:border-[#2f6b4a] focus:outline-none text-black"
                placeholder="e.g. India, USA, UK..."
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#1f2c22]">What are your food preferences?</h2>
              <p className="text-sm text-gray-500">Choose the diet that fits you best.</p>
              <div className="grid grid-cols-2 gap-3">
                {foodOptions.map((pref) => (
                  <motion.button
                    key={pref}
                    onClick={() => setFoodPref(pref)}
                    className={`flex h-20 items-center justify-center rounded-2xl border-2 text-sm font-semibold transition ${
                      foodPref === pref ? "border-[#2f6b4a] bg-[#f4faf6] text-[#2f6b4a]" : "border-[#eef0ed] bg-[#f9faf9] text-gray-600 hover:border-[#d7e0d9]"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {pref}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#1f2c22]">What is your budget?</h2>
              <p className="text-sm text-gray-500">We will match swaps to your wallet.</p>
              <div className="space-y-3">
                {budgetOptions.map((b) => (
                  <motion.button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-4 text-left text-sm font-bold transition ${
                      budget === b ? "border-[#2f6b4a] bg-[#f4faf6] text-[#1f2c22]" : "border-[#eef0ed] bg-[#f9faf9] text-gray-700 hover:border-[#d7e0d9]"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span>{b}</span>
                    <span className="text-[#2f6b4a]">{b === "Low" ? "$" : b === "Medium" ? "$$" : "$$$"}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#1f2c22]">Any taste preferences?</h2>
              <p className="text-sm text-gray-500">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-3">
                {tasteOptions.map((taste) => (
                  <motion.button
                    key={taste}
                    onClick={() => toggleTaste(taste)}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                      tastes.includes(taste)
                        ? "border-[#2f6b4a] bg-[#f4faf6] text-[#2f6b4a]"
                        : "border-[#eef0ed] bg-[#f9faf9] text-gray-600 hover:border-[#d7e0d9]"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {taste}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <motion.button
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-[#f0f5f2]"
              onClick={prev}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back
            </motion.button>
            <motion.button
              className="rounded-full bg-[#2f6b4a] px-5 py-3 text-sm font-extrabold text-white shadow-sm shadow-[#2f6b4a]/20"
              onClick={next}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {step === 4 ? "Save & Start Exploring" : "Continue"} →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
