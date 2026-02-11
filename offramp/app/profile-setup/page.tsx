"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { NavAuthButton } from "@/app/components/NavAuthButton";
import {
  BudgetLevel,
  fetchUserPreferences,
  saveBudgetPreference,
  saveCuisinePreferences,
  saveUserAllergies,
} from "@/lib/profilePreferences";

const impact = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-impact" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const DEFAULT_BUDGET_LEVEL: BudgetLevel = 1;

const cuisines = [
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Punjab",
  "Rajasthan",
  "Uttar Pradesh",
  "Delhi",
];

const allergies = ["Peanuts", "Tree Nuts", "Soy", "Milk", "Eggs", "Sesame"];

const upcomingRegions = ["West India", "Central India", "Global Fusion"];
const upcomingCuisines = ["Bengali", "Goan", "Indo-Chinese", "Konkan"];
const upcomingAllergies = ["Gluten", "Shellfish", "Mustard"];

const budgetLevels: Record<BudgetLevel, { label: string; description: string; icon: string }> = {
  1: {
    label: "Budget-conscious",
    description: "Focus on affordable, accessible ingredients",
    icon: "payments",
  },
  2: {
    label: "Standard",
    description: "Balanced between cost and quality",
    icon: "account_balance_wallet",
  },
  3: {
    label: "Premium",
    description: "Premium ingredients and specialty items",
    icon: "diamond",
  },
};

const budgetMoodByLevel: Record<BudgetLevel, { emoji: string; label: string }> = {
  1: { emoji: "🙂", label: "Budget-friendly pick" },
  2: { emoji: "😌", label: "Balanced comfort" },
  3: { emoji: "🤩", label: "Premium treat" },
};

const cn = (...classes: Array<string | null | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type SupabaseErrorPayload = {
  message?: string;
  code?: string;
  details?: string;
};

const extractErrorInfo = (error: unknown): Required<Pick<SupabaseErrorPayload, "message">> & SupabaseErrorPayload => {
  if (!error) {
    return { message: "Unknown error" };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error instanceof Error) {
    const payload = error as SupabaseErrorPayload;
    return {
      message: payload.message ?? error.message ?? error.toString(),
      code: payload.code,
      details: payload.details,
    };
  }

  const payload = error as SupabaseErrorPayload;
  return {
    message: payload?.message ?? JSON.stringify(error),
    code: payload?.code,
    details: payload?.details,
  };
};

const logSupabaseErrorDetails = (context: string, error: unknown) => {
  const { message, code, details } = extractErrorInfo(error);
  const segments = [context, `message=${message}`];
  if (code) segments.push(`code=${code}`);
  if (details) segments.push(`details=${details}`);

  if (error) {
    console.error(segments.join(" | "), error);
    return;
  }

  console.error(segments.join(" | "));
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [currentStep, setCurrentStep] = useState(1);
  const [prevStep, setPrevStep] = useState<number | null>(null);
  const [region, setRegion] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(DEFAULT_BUDGET_LEVEL);
  const [isCompleting, setIsCompleting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const totalSteps = 4;

  const budget = useMemo(() => budgetLevels[budgetLevel], [budgetLevel]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          logSupabaseErrorDetails("profile-setup:getSession", error);
          throw error;
        }
        const active = data.session ?? null;
        setSession(active);
        if (!active) {
          router.replace("/auth");
        }
      } catch (error) {
        logSupabaseErrorDetails("profile-setup:init", error);
        setSession(null);
        router.replace("/auth");
      } finally {
        setCheckingSession(false);
      }
    };
    void init();

    const { data: listener, error: listenerError } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          router.replace("/profile-setup");
        }
      }
    );

    if (listenerError) {
      logSupabaseErrorDetails("profile-setup:onAuthStateChange", listenerError);
      return () => {};
    }

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const resolveUserId = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      logSupabaseErrorDetails("profile-setup:getUser", error);
      throw error;
    }
    return data.user?.id ?? null;
  }, [supabase]);

  const loadProfileData = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const userId = await resolveUserId();
      if (!userId) {
        return;
      }
      const preferences = await fetchUserPreferences(supabase, userId);
      setRegion(preferences.region ?? "");
      setSelectedCuisines(preferences.cuisines ?? []);
      setSelectedAllergies(preferences.allergies ?? []);
      setBudgetLevel(preferences.budgetLevel ?? DEFAULT_BUDGET_LEVEL);
    } catch (error) {
      logSupabaseErrorDetails("profile-setup:loadProfileData", error);
      alert("We couldn't load your saved preferences. Please try again.");
    } finally {
      setIsProfileLoading(false);
    }
  }, [resolveUserId, supabase]);

  useEffect(() => {
    if (!session) return;
    void loadProfileData();
  }, [loadProfileData, session]);

  const toggleCuisine = (name: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggleAllergy = (name: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const goToStep = (step: number) => {
    if (step < 1 || step > totalSteps || step === currentStep) return;
    setPrevStep(currentStep);
    setCurrentStep(step);
    setTimeout(() => setPrevStep(null), 300);
  };

  const nextStep = async () => {
    if (currentStep === totalSteps) {
      completeSetup();
      return;
    }

    if (isSavingStep || isProfileLoading) return;

    setIsSavingStep(true);
    try {
      const userId = await resolveUserId();
      if (!userId) {
        alert("Please sign in to save your preferences.");
        return;
      }

      if (currentStep === 1) {
        await saveCuisinePreferences(supabase, userId, region, selectedCuisines);
      } else if (currentStep === 2) {
        await saveUserAllergies(supabase, userId, selectedAllergies);
      } else if (currentStep === 3) {
        await saveBudgetPreference(supabase, userId, budgetLevel);
      }

      if (currentStep + 1 === totalSteps) {
        await loadProfileData();
      }

      goToStep(currentStep + 1);
    } catch (error) {
      logSupabaseErrorDetails("profile-setup:nextStep", error);
      alert("We couldn't save your preferences. Please try again.");
    } finally {
      setIsSavingStep(false);
    }
  };

  const previousStep = () => {
    if (currentStep === 1) return;
    goToStep(currentStep - 1);
  };

  const handleEditStep = async (step: number) => {
    if (isSavingStep || isProfileLoading) return;
    await loadProfileData();
    goToStep(step);
  };

  const completeSetup = () => {
    setIsCompleting(true);
    setTimeout(() => {
      // alert("Setup complete! Redirecting to your personalized swap recommendations...");
      setIsCompleting(false);
      router.push("/swap");
    }, 500);
  };

  const stepLabelStyles = (step: number) => {
    if (step === currentStep) return { circle: "bg-accent text-white", text: "text-accent", faded: false };
    if (step < currentStep) return { circle: "bg-primary text-white", text: "text-primary", faded: false };
    return { circle: "bg-white text-slate-400", text: "text-slate-400", faded: true };
  };

  return (
    <>
      {checkingSession ? (
        <div className="min-h-screen flex items-center justify-center bg-highlight text-slate-800">
          <p className="font-bold">Checking session...</p>
        </div>
      ) : !session ? null : (
        <main
          className={cn(
            "profile-setup min-h-screen flex flex-col bg-highlight text-slate-900",
            jakarta.className,
            impact.variable
          )}
        >
      <nav className="sticky top-0 z-50 bg-highlight/90 backdrop-blur-sm transition-all duration-300 border-b-3 border-black">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="group flex items-center gap-1">
            <img
              src="/image.png"
              alt="OffRamp logo"
              className="h-24 w-24 rounded-full object-contain transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-3xl uppercase tracking-wide text-black">OffRamp</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider md:flex">
            <div className="relative group">
              <Link
                href="/#home"
                className="relative flex items-center gap-1 transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
              >
                Home
                <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:rotate-180">
                  expand_more
                </span>
              </Link>
              <div className="absolute left-0 top-full z-20 mt-3 hidden min-w-[360px] rounded-2xl border-2 border-black bg-white px-2 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:block">
                <div className="absolute -top-3 left-0 right-0 h-3" />
                <div className="grid grid-cols-4 gap-2 divide-x divide-black/10">
                  <Link
                    href="/#how-it-works"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">home</span>
                    <span>How it Works</span>
                  </Link>
                  <Link
                    href="/#features"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">auto_graph</span>
                    <span>Features</span>
                  </Link>
                  <Link
                    href="/#impact"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">insights</span>
                    <span>Impact</span>
                  </Link>
                  <Link
                    href="/#institutions"
                    className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                  >
                    <span className="material-symbols-outlined mb-2 text-xl text-slate-500">apartment</span>
                    <span>Institutions</span>
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="/swap"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Food Swap
            </Link>
            <Link
              href="/coming-soon"
              prefetch={false}
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Coming Soon
            </Link>
            <Link
              href="/about"
              prefetch={false}
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              About
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <NavAuthButton className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white sm:flex" userHref="/profile-setup" userLabelPrefix="Hi" />
          </div>
        </div>
      </nav>

      <section className="flex-1 py-12 px-6 grid-pattern-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 fade-in">
            <div className="flex flex-col gap-6 rounded-3xl border-3 border-black bg-white/90 p-6 shadow-progress">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Step {currentStep} of {totalSteps}</p>
                  <h1 className="font-impact text-4xl text-black">{[
                    "Cuisines",
                    "Constraints",
                    "Budget",
                    "Review",
                  ][currentStep - 1]}</h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                  <div className="h-2 w-40 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { step: 1, label: "Cuisines" },
                  { step: 2, label: "Constraints" },
                  { step: 3, label: "Budget" },
                  { step: 4, label: "Review" },
                ].map(({ step, label }) => {
                  const isActive = step === currentStep;
                  const isComplete = step < currentStep;
                  return (
                    <div
                      key={step}
                      className={cn(
                        "rounded-2xl border-2 px-4 py-3 text-center uppercase transition-all",
                        isActive && "border-accent bg-accent/10 text-accent shadow-step",
                        isComplete && "border-black bg-slate-50 text-black",
                        !isActive && !isComplete && "border-slate-200 text-slate-400"
                      )}
                    >
                      <p className="text-xs font-bold tracking-[0.2em]">Step {step}</p>
                      <p className="font-impact text-xl">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border-3 border-black shadow-form p-8 md:p-12 fade-in delay-100 relative overflow-hidden">
            {(prevStep || currentStep) && (
              <>
                {prevStep && (
                  <div className="form-step slide-out absolute inset-0 pointer-events-none" data-step={prevStep}>
                    {prevStep === 1 && <CuisinesStep region={region} setRegion={setRegion} selectedCuisines={selectedCuisines} toggleCuisine={toggleCuisine} />}
                    {prevStep === 2 && <ConstraintsStep selectedAllergies={selectedAllergies} toggleAllergy={toggleAllergy} />}
                    {prevStep === 3 && <BudgetStep budgetLevel={budgetLevel} setBudgetLevel={setBudgetLevel} budget={budget} />}
                    {prevStep === 4 && (
                      <ReviewStep
                        region={region}
                        selectedCuisines={selectedCuisines}
                        selectedAllergies={selectedAllergies}
                        budget={budget}
                        onEditStep={handleEditStep}
                        isCompleting={isCompleting}
                      />
                    )}
                  </div>
                )}

                <div className="form-step active" data-step={currentStep}>
                  {currentStep === 1 && (
                    <CuisinesStep
                      region={region}
                      setRegion={setRegion}
                      selectedCuisines={selectedCuisines}
                      toggleCuisine={toggleCuisine}
                    />
                  )}
                  {currentStep === 2 && (
                    <ConstraintsStep selectedAllergies={selectedAllergies} toggleAllergy={toggleAllergy} />
                  )}
                  {currentStep === 3 && (
                    <BudgetStep budgetLevel={budgetLevel} setBudgetLevel={setBudgetLevel} budget={budget} />
                  )}
                  {currentStep === 4 && (
                    <ReviewStep
                      region={region}
                      selectedCuisines={selectedCuisines}
                      selectedAllergies={selectedAllergies}
                      budget={budget}
                      onEditStep={handleEditStep}
                      isCompleting={isCompleting}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-dashed border-slate-300 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <button
              id="backBtn"
              className={cn(
                "w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-10 py-4 font-semibold text-slate-600 transition-all hover:border-black hover:text-black",
                currentStep === 1 ? "hidden" : ""
              )}
              onClick={previousStep}
            >
              <span className="material-symbols-outlined">chevron_left</span>
              Back
            </button>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
              <button
                id="skipBtn"
                className={cn(
                  "w-full sm:w-auto rounded-2xl border border-slate-300 px-12 py-4 font-semibold text-slate-500 transition-all hover:border-black hover:text-black",
                  currentStep === totalSteps ? "hidden" : ""
                )}
                onClick={() => void nextStep()}
              >
                Skip
              </button>
              <button
                id="nextBtn"
                className="w-full sm:w-auto rounded-2xl border-2 border-black bg-accent px-16 py-4 font-impact text-xl uppercase tracking-wide text-white shadow-strong transition-all hover:-translate-y-0.5 hover:bg-black"
                onClick={() => void nextStep()}
              >
                {currentStep === totalSteps ? (
                  <>
                    <span className="material-symbols-outlined">check</span> Complete Setup
                  </>
                ) : (
                  <>
                    Next <span className="material-symbols-outlined">chevron_right</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-3 border-black bg-white px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <div className="group flex items-center gap-1">
            <img
              src="/image.png"
              alt="OffRamp logo"
              className="h-[120px] w-[120px] rounded-full object-contain transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-4xl uppercase">OffRamp</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest">
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Privacy
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Terms
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              LinkedIn
            </a>
            <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
              Contact
            </a>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            © 2026 OFFRAMP. BE BOLD. EAT WELL.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .profile-setup .grid-pattern-subtle {
          background-color: #f5efe6;
          background-image: radial-gradient(circle, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .profile-setup .fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .profile-setup .form-step { animation: slideIn 0.5s ease-out; }
        .profile-setup .form-step.slide-out { animation: slideOut 0.3s ease-out; }
        .profile-setup .shadow-progress { box-shadow: 0 25px 60px rgba(15, 23, 42, 0.2); }
        .profile-setup .shadow-form { box-shadow: 0 35px 60px rgba(15, 23, 42, 0.25); }
        .profile-setup .shadow-strong { box-shadow: 0 25px 45px rgba(15, 23, 42, 0.25); }
        .profile-setup .card-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          border: 1px solid #0b1c21;
          background: #fff7f2;
          font-family: 'Material Symbols Outlined';
          font-size: 24px;
          color: #ff6b35;
        }
        .profile-setup .form-card {
          border: 2px solid rgba(15, 23, 42, 0.1);
          border-radius: 28px;
          padding: 32px;
          background: white;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
        }
        .profile-setup .form-select {
          width: 100%;
          border: 2px solid rgba(15, 23, 42, 0.15);
          border-radius: 20px;
          padding: 18px 56px 18px 20px;
          font-weight: 600;
          color: #0f172a;
          background: #fdfbfa;
          appearance: none;
        }
        .profile-setup .form-select:focus {
          outline: none;
          border-color: #ff6b35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.2);
        }
        .profile-setup .option-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid rgba(15, 23, 42, 0.1);
          border-radius: 20px;
          padding: 18px 20px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .profile-setup .option-pill-active {
          border-color: #ff6b35;
          background: rgba(255, 107, 53, 0.08);
          color: #ff6b35;
        }
        .profile-setup .option-pill-disabled {
          border-style: dashed;
          background: rgba(241, 245, 249, 0.8);
          color: #94a3b8;
          cursor: not-allowed;
          pointer-events: none;
        }
        .profile-setup .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .profile-setup .budget-slider {
          width: 100%;
          height: 12px;
          appearance: none;
          background: transparent;
          position: relative;
          z-index: 2;
        }
        .profile-setup .budget-slider::-webkit-slider-thumb {
          appearance: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ff6b35;
          border: 4px solid #fff;
          box-shadow: 0 5px 20px rgba(255, 107, 53, 0.45);
        }
        .profile-setup .budget-slider::-moz-range-thumb {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ff6b35;
          border: 4px solid #fff;
          box-shadow: 0 5px 20px rgba(255, 107, 53, 0.45);
        }
        .profile-setup .budget-mood-bubble {
          position: absolute;
          top: -60px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid #ff6b35;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          box-shadow: 0 10px 25px rgba(255, 107, 53, 0.25);
          transition: left 0.3s ease, transform 0.2s ease;
          pointer-events: none;
        }
        .profile-setup .budget-mood-bubble::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          width: 12px;
          height: 12px;
          background: #fff;
          border-left: 2px solid #ff6b35;
          border-bottom: 2px solid #ff6b35;
          transform: translate(-50%, 0) rotate(45deg);
        }
        .profile-setup .tier-card {
          border: 2px solid rgba(15, 23, 42, 0.1);
          border-radius: 24px;
          padding: 24px;
          background: #fff;
          text-align: left;
          display: flex;
          gap: 16px;
          transition: all 0.2s ease;
        }
        .profile-setup .tier-card-active {
          border-color: #ff6b35;
          background: rgba(255, 107, 53, 0.08);
        }
        .profile-setup .info-banner {
          display: flex;
          gap: 12px;
          border-radius: 24px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          padding: 20px 24px;
          background: #fffefa;
          align-items: center;
        }
        .profile-setup .review-card {
          border: 2px solid rgba(15, 23, 42, 0.08);
          border-radius: 28px;
          padding: 28px;
          background: #fff;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
        }
        .profile-setup .review-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .profile-setup .edit-link {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #ff6b35;
          letter-spacing: 0.1em;
        }
        .profile-setup .edit-link:hover { text-decoration: underline; }
        .profile-setup .cuisine-pill {
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.15);
          padding: 8px 16px;
          font-weight: 600;
          color: #0f172a;
          background: #fdfbfa;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-50px); } }
      `}</style>
        </main>
      )}
    </>
  );
}

type CuisinesStepProps = {
  region: string;
  setRegion: (value: string) => void;
  selectedCuisines: string[];
  toggleCuisine: (name: string) => void;
};

function CuisinesStep({ region, setRegion, selectedCuisines, toggleCuisine }: CuisinesStepProps) {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-impact text-5xl md:text-6xl text-black uppercase leading-tight">What cuisines do you eat?</h1>
        <p className="text-lg font-semibold text-slate-500">Select the regions and cuisines you're interested in.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
        <div className="form-card">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined card-icon">public</span>
            <h3 className="font-impact text-2xl text-black">Region</h3>
          </div>
          <div className="relative mt-6">
            <select
              className="form-select"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">Select a region...</option>
              <option value="south-india">South India</option>
              <option value="north-india">North India</option>
              <option value="east-india">East India</option>
              <option value="thai">Thai</option>
              <option value="mexican">Mexican</option>
              <option value="mediterranean">Mediterranean</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-2xl text-slate-400">
              expand_more
            </span>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="material-symbols-outlined text-base text-slate-400">pending</span>
              Coming Soon
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {upcomingRegions.map((item) => (
                <span key={item} className="option-pill option-pill-disabled">
                  <span className="material-symbols-outlined text-2xl text-slate-400">lock_clock</span>
                  <span className="font-semibold">{item}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="flex flex-wrap items-center gap-3">
            <span className="material-symbols-outlined card-icon bg-primary text-white">restaurant</span>
            <div>
              <h3 className="font-impact text-2xl text-black uppercase">Preferred Cuisines</h3>
              <p className="text-sm font-semibold uppercase text-slate-400">(Optional)</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {cuisines.map((name) => {
              const checked = selectedCuisines.includes(name);
              return (
                <label
                  key={name}
                  className={cn(
                    "option-pill",
                    checked && "option-pill-active"
                  )}
                >
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCuisine(name)}
                  />
                  <span className="material-symbols-outlined text-2xl text-slate-400">restaurant_menu</span>
                  <span className="font-semibold">{name}</span>
                </label>
              );
            })}
            <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <span className="material-symbols-outlined text-base text-slate-400">restaurant_menu</span>
                Coming Soon
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {upcomingCuisines.map((item) => (
                  <span key={item} className="option-pill option-pill-disabled">
                    <span className="material-symbols-outlined text-2xl text-slate-400">browse_gallery</span>
                    <span className="font-semibold">{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ConstraintsStepProps = {
  selectedAllergies: string[];
  toggleAllergy: (name: string) => void;
};

function ConstraintsStep({ selectedAllergies, toggleAllergy }: ConstraintsStepProps) {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h2 className="font-impact text-5xl md:text-6xl text-black uppercase leading-tight">Tell us about your constraints</h2>
        <p className="text-lg font-semibold text-slate-500">Help us avoid recommending dishes you can't eat.</p>
      </header>

      <div className="form-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined card-icon bg-accent text-white">emergency</span>
            <div>
              <h3 className="font-impact text-2xl text-black uppercase">Allergies</h3>
              <p className="text-sm font-semibold uppercase text-slate-400">(Optional)</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allergies.map((name) => {
            const checked = selectedAllergies.includes(name);
            return (
              <label
                key={name}
                className={cn("option-pill", checked && "option-pill-active")}
              >
                <input
                  className="sr-only"
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAllergy(name)}
                />
                <span className="material-symbols-outlined text-2xl text-slate-400">medication</span>
                <span className="font-semibold">{name}</span>
              </label>
            );
          })}
        </div>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            <span className="material-symbols-outlined text-base text-slate-400">healing</span>
            Coming Soon
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingAllergies.map((item) => (
              <span key={item} className="option-pill option-pill-disabled">
                <span className="material-symbols-outlined text-2xl text-slate-400">symptoms</span>
                <span className="font-semibold">{item}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type BudgetStepProps = {
  budgetLevel: BudgetLevel;
  setBudgetLevel: (level: BudgetLevel) => void;
  budget: { label: string; description: string; icon: string };
};

function BudgetStep({ budgetLevel, setBudgetLevel, budget }: BudgetStepProps) {
  const mood = budgetMoodByLevel[budgetLevel];
  const sliderPercentage = ((budgetLevel - 1) / 2) * 100;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-impact text-5xl md:text-6xl text-black uppercase leading-tight">What's your budget level?</h2>
        <p className="text-lg font-semibold text-slate-500">This helps us prioritize recommendations.</p>
      </header>

      <div className="form-card space-y-10">
        <div className="flex flex-col gap-3 text-center">
          <div className="mx-auto inline-flex items-center gap-3 rounded-2xl border border-black bg-accent px-6 py-3 text-white">
            <span className="material-symbols-outlined text-2xl">{budget.icon}</span>
            <span className="font-impact text-3xl uppercase">{budget.label}</span>
          </div>
          <p className="text-base font-semibold text-slate-500">{budget.description}</p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <input
              type="range"
              min={1}
              max={3}
              value={budgetLevel}
              className="budget-slider"
              onChange={(e) => setBudgetLevel(Number(e.target.value) as BudgetLevel)}
            />
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="h-1 rounded-full bg-slate-200" />
            </div>
            <div
              className="budget-mood-bubble"
              style={{ left: `calc(${sliderPercentage}% - 22px)` }}
              aria-hidden="true"
            >
              {mood.emoji}
            </div>
            <span className="sr-only">{mood.label}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {([
              { level: 1 as BudgetLevel, icon: "payments" },
              { level: 2 as BudgetLevel, icon: "account_balance_wallet" },
              { level: 3 as BudgetLevel, icon: "diamond" },
            ]).map(({ level, icon }) => (
              <button
                type="button"
                key={level}
                className={cn("tier-card", budgetLevel === level && "tier-card-active")}
                onClick={() => setBudgetLevel(level)}
              >
                <span className="material-symbols-outlined text-3xl text-accent">{icon}</span>
                <div>
                  <p className="font-impact text-2xl text-black">{budgetLevels[level].label}</p>
                  <p className="text-sm font-semibold text-slate-400">{budgetLevels[level].description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="info-banner">
        <span className="material-symbols-outlined text-black">info</span>
        <p className="text-sm font-semibold text-black">
          Budget level affects how we rank recommendations, but all swaps are designed to be affordable and accessible.
        </p>
      </div>
    </div>
  );
}

type ReviewStepProps = {
  region: string;
  selectedCuisines: string[];
  selectedAllergies: string[];
  budget: { label: string; description: string; icon: string };
  onEditStep: (step: number) => Promise<void> | void;
  isCompleting: boolean;
};

function ReviewStep({ region, selectedCuisines, selectedAllergies, budget, onEditStep, isCompleting }: ReviewStepProps) {
  const regionLabel = useMemo(() => {
    const options: Record<string, string> = {
      "south-india": "South India",
      "north-india": "North India",
      "east-india": "East India",
      thai: "Thai",
      mexican: "Mexican",
      mediterranean: "Mediterranean",
    };
    return options[region] || "Select a region...";
  }, [region]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-impact text-5xl md:text-6xl text-black uppercase leading-tight">You're all set!</h2>
        <p className="text-lg font-semibold text-slate-500">Review your preferences before we find your perfect swaps.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="review-card md:col-span-2">
          <div className="review-card-header">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined card-icon">public</span>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Your Cuisines</p>
                <h3 className="font-impact text-3xl text-black">{regionLabel}</h3>
              </div>
            </div>
            <button className="edit-link" onClick={() => void onEditStep(1)}>
              Edit
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="cuisine-pill bg-accent text-white border-0" id="reviewRegion">
              {regionLabel}
            </span>
            {renderCuisinePillList(selectedCuisines)}
          </div>
        </div>

        <div className="review-card">
          <div className="review-card-header">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined card-icon bg-accent text-white">emergency</span>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Your Constraints</p>
                <h3 className="font-impact text-3xl text-black">Allergies</h3>
              </div>
            </div>
            <button className="edit-link" onClick={() => void onEditStep(2)}>
              Edit
            </button>
          </div>
          <p className="mt-4 text-base font-semibold text-slate-600" id="reviewAllergies">
            {selectedAllergies.length ? selectedAllergies.join(", ") : "No allergies selected"}
          </p>
        </div>

        <div className="review-card">
          <div className="review-card-header">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined card-icon bg-primary text-white" id="reviewBudgetIcon">
                {budget.icon}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Your Budget</p>
                <h3 className="font-impact text-3xl text-black" id="reviewBudgetLevel">
                  {budget.label}
                </h3>
              </div>
            </div>
            <button className="edit-link" onClick={() => void onEditStep(3)}>
              Edit
            </button>
          </div>
          <p className="mt-4 text-base font-semibold text-slate-600" id="reviewBudgetDesc">
            {budget.description}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "rounded-[28px] border-3 border-black bg-primary px-10 py-12 text-center text-white shadow-form",
          isCompleting && "animate-pulse"
        )}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h3 className="font-impact text-4xl uppercase">Ready to Swap!</h3>
        <p className="mt-2 text-base font-semibold text-white/80">
          We'll use these preferences to find your perfect plant-based alternatives.
        </p>
      </div>
    </div>
  );
}

function renderCuisinePillList(list: string[]) {
  if (!list.length) return null;
  return list.map((item) => (
    <span key={item} className="cuisine-pill">
      {item}
    </span>
  ));
}
