"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { NavAuthButton } from "@/app/components/NavAuthButton";

const impact = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-impact" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

type BudgetLevel = 1 | 2 | 3;

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

const cn = (...classes: Array<string | null | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [currentStep, setCurrentStep] = useState(1);
  const [prevStep, setPrevStep] = useState<number | null>(null);
  const [region, setRegion] = useState("south-india");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(1);
  const [isCompleting, setIsCompleting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const totalSteps = 4;

  const budget = useMemo(() => budgetLevels[budgetLevel], [budgetLevel]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const active = data.session ?? null;
      setSession(active);
      setCheckingSession(false);
      if (!active) {
        router.replace("/auth");
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        router.replace("/profile-setup");
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

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

  const nextStep = () => {
    if (currentStep === totalSteps) return completeSetup();
    goToStep(currentStep + 1);
  };

  const previousStep = () => {
    if (currentStep === 1) return;
    goToStep(currentStep - 1);
  };

  const completeSetup = () => {
    setIsCompleting(true);
    // TODO: Wire up persistence to backend profile endpoint here.
    setTimeout(() => {
      alert("Setup complete! Redirecting to your personalized swap recommendations...");
      setIsCompleting(false);
    }, 1000);
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
              src="/logo-removebg-preview.png"
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
              href="/#coming-soon"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Coming Soon
            </Link>
            <Link
              href="/#about"
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 fade-in">
            <div className="relative">
              <div className="flex gap-3 mb-6">
                {Array.from({ length: totalSteps }).map((_, idx) => {
                  const step = idx + 1;
                  const isActive = step <= currentStep;
                  return (
                    <div
                      key={step}
                      className={cn(
                        "progress-segment h-3 flex-1 rounded-full border-2 border-black transition-all duration-500",
                        isActive ? "bg-accent active" : "bg-white"
                      )}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between px-2 mb-4">
                {[
                  { step: 1, label: "Cuisines" },
                  { step: 2, label: "Constraints" },
                  { step: 3, label: "Budget" },
                  { step: 4, label: "Review" },
                ].map(({ step, label }) => {
                  const { circle, text, faded } = stepLabelStyles(step);
                  return (
                    <div
                      key={step}
                      className={cn("flex flex-col items-center step-label", faded && "opacity-50")}
                      data-step={step}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-impact text-xl border-2 border-black transition-all duration-300",
                          circle
                        )}
                      >
                        {step}
                      </div>
                      <span className={cn("text-xs font-bold mt-2 uppercase", text)}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-impact text-2xl text-accent" id="currentStep">STEP {currentStep}</span>
              <span className="text-slate-500 font-bold">of 4</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-3 border-black bold-shadow p-8 md:p-12 fade-in delay-100 relative overflow-hidden">
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
                        goToStep={goToStep}
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
                      goToStep={goToStep}
                      isCompleting={isCompleting}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-12 pt-8 border-t-2 border-black flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button
              id="backBtn"
              className={cn(
                "w-full sm:w-auto px-10 py-4 rounded-xl border-2 border-black bg-white font-bold text-slate-800 transition-all flex items-center justify-center gap-2 uppercase text-lg hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                currentStep === 1 ? "hidden" : ""
              )}
              onClick={previousStep}
            >
              <span className="material-symbols-outlined">chevron_left</span>
              Back
            </button>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto ml-auto">
              <button
                id="skipBtn"
                className={cn(
                  "w-full sm:w-auto px-12 py-4 rounded-xl bg-white border-2 border-black text-slate-600 font-bold transition-all uppercase text-lg hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                  currentStep === totalSteps ? "hidden" : ""
                )}
                onClick={nextStep}
              >
                Skip
              </button>
              <button
                id="nextBtn"
                className="w-full sm:w-auto px-16 py-4 rounded-xl bg-accent text-white font-bold border-2 border-black transition-all flex items-center justify-center gap-2 uppercase text-lg hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-black"
                onClick={nextStep}
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
              src="/logo-removebg-preview.png"
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
        .profile-setup .bold-shadow { box-shadow: 8px 8px 0px 0px rgba(0,0,0,1); }
        .profile-setup .bold-shadow-sm { box-shadow: 4px 4px 0px 0px rgba(0,0,0,1); }
        .profile-setup .grid-pattern-subtle {
          background-color: #F5EFE6;
          background-image: radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .profile-setup .fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .profile-setup .form-step { animation: slideIn 0.5s ease-out; }
        .profile-setup .form-step.slide-out { animation: slideOut 0.3s ease-out; }
        .profile-setup .progress-segment { transition: all 0.5s ease-out; }
        .profile-setup .progress-segment.active { background-color: #FF6B35; }
        .profile-setup .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .profile-setup .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 9999px; }
        .profile-setup .custom-scrollbar::-webkit-scrollbar-thumb { background: #1A4D2E; border-radius: 9999px; }
        .profile-setup input[type="checkbox"] { cursor: pointer; transition: all 0.2s ease; }
        .profile-setup input[type="checkbox"]:checked { background: #1A4D2E; border-color: #1A4D2E; }
        .profile-setup .budget-marker .emoji-container > div { position: relative; }
        .profile-setup .budget-marker.active .emoji-container > div {
          background: linear-gradient(135deg, #FF6B35 0%, #ff8c5a 100%);
          transform: scale(1.15);
          box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
          animation: bounceEmoji 0.5s ease-out;
        }
        .profile-setup .budget-marker .emoji-container > div::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%) scale(0);
          width: 8px;
          height: 8px;
          background: #FF6B35;
          border-radius: 50%;
          border: 2px solid #000;
          transition: transform 0.3s ease;
        }
        .profile-setup .budget-marker.active .emoji-container > div::after { transform: translateX(-50%) scale(1); }
        .profile-setup .emoji-container > div:hover { animation: popOut 0.4s ease-out forwards; }
        .profile-setup .budget-slider::-webkit-slider-thumb {
          appearance: none;
          width: 32px;
          height: 32px;
          background: #FF6B35;
          border: 3px solid #000;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
          transition: all 0.2s;
        }
        .profile-setup .budget-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 3px 3px 0px 0px rgba(0,0,0,1);
        }
        .profile-setup .budget-slider::-moz-range-thumb {
          width: 32px;
          height: 32px;
          background: #FF6B35;
          border: 3px solid #000;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 2px 2px 0px 0px rgba(0,0,0,1);
          transition: all 0.2s;
        }
        .profile-setup .budget-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 3px 3px 0px 0px rgba(0,0,0,1);
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-50px); } }
        @keyframes bounceEmoji { 0%, 100% { transform: scale(1.15) translateY(0); } 50% { transform: scale(1.25) translateY(-8px); } }
        @keyframes popOut { 0% { transform: scale(1) translateY(0); } 50% { transform: scale(1.3) translateY(-10px); } 100% { transform: scale(1.25) translateY(-8px); } }
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
    <div className="mb-16">
      <div className="mb-8">
        <h1 className="font-impact text-5xl md:text-6xl text-black mb-3 uppercase leading-tight">What cuisines do you eat?</h1>
        <p className="text-slate-600 text-lg font-semibold">Select the regions and cuisines you're interested in.</p>
      </div>

      <div className="space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-grid border-2 border-black rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-black">public</span>
            </div>
            <h3 className="font-impact text-2xl uppercase tracking-wide text-slate-800">Region</h3>
          </div>
          <div className="relative">
            <select
              className="w-full px-5 py-4 rounded-xl border-3 border-black bg-white text-slate-800 font-bold text-lg appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-accent/20 transition-all hover:bg-highlight"
              style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}
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
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="material-symbols-outlined text-2xl text-black">expand_more</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary border-2 border-black rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">restaurant</span>
            </div>
            <h3 className="font-impact text-2xl uppercase tracking-wide text-slate-800">Preferred Cuisines</h3>
            <span className="text-sm font-bold text-slate-400 uppercase">(Optional)</span>
          </div>
          <div className="max-h-64 overflow-y-auto pr-4 custom-scrollbar bg-highlight rounded-2xl border-2 border-black p-6">
            <div className="grid grid-cols-2 gap-4">
              {cuisines.map((name) => {
                const checked = selectedCuisines.includes(name);
                return (
                  <label
                    key={name}
                    className="flex items-center gap-3 p-3 cursor-pointer group hover:bg-white rounded-lg transition-all border-2 border-transparent hover:border-black"
                  >
                    <input
                      className="w-5 h-5 rounded border-2 border-black text-primary focus:ring-primary focus:ring-2"
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCuisine(name)}
                    />
                    <span className="text-slate-700 font-bold group-hover:text-primary transition-colors">{name}</span>
                  </label>
                );
              })}
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
    <div className="mb-16">
      <div className="mb-8">
        <h2 className="font-impact text-5xl md:text-6xl text-black mb-3 uppercase leading-tight">Tell us about your constraints</h2>
        <p className="text-slate-600 text-lg font-semibold">Help us avoid recommending dishes you can't eat.</p>
      </div>

      <div className="space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-accent border-2 border-black rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">emergency</span>
            </div>
            <h3 className="font-impact text-2xl uppercase tracking-wide text-slate-800">Allergies</h3>
            <span className="text-sm font-bold text-slate-400 uppercase">(Optional)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allergies.map((name) => {
              const checked = selectedAllergies.includes(name);
              return (
                <label
                  key={name}
                  className="flex items-center gap-3 p-4 cursor-pointer bg-white hover:bg-highlight rounded-xl border-2 border-black transition-all hover:-translate-y-0.5 bold-shadow-sm"
                >
                  <input
                    className="w-5 h-5 rounded border-2 border-black text-accent focus:ring-accent focus:ring-2"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAllergy(name)}
                  />
                  <span className="text-slate-800 font-bold">{name}</span>
                </label>
              );
            })}
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
  return (
    <div className="mb-4">
      <div className="mb-8">
        <h2 className="font-impact text-5xl md:text-6xl text-black mb-3 uppercase leading-tight">What's your budget level?</h2>
        <p className="text-slate-600 text-lg font-semibold">This helps us prioritize recommendations.</p>
      </div>

      <div className="bg-white rounded-2xl border-3 border-black p-8 bold-shadow">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent text-white rounded-xl border-2 border-black">
            <span className="material-symbols-outlined text-2xl">{budget.icon}</span>
            <span className="font-impact text-3xl uppercase">{budget.label}</span>
          </div>
          <p className="mt-4 text-slate-600 font-semibold">{budget.description}</p>
        </div>

        <div className="relative px-4">
          <input
            type="range"
            min={1}
            max={3}
            value={budgetLevel}
            className="budget-slider w-full h-3 bg-highlight rounded-full appearance-none cursor-pointer border-2 border-black"
            style={{ boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)" }}
            onChange={(e) => setBudgetLevel(Number(e.target.value) as BudgetLevel)}
          />
          <div className="flex justify-between mt-6 px-2">
            {[
              { level: 1 as BudgetLevel, emoji: "😊", label: "Budget" },
              { level: 2 as BudgetLevel, emoji: "😄", label: "Standard" },
              { level: 3 as BudgetLevel, emoji: "💰", label: "Premium" },
            ].map(({ level, emoji, label }) => (
              <div key={label} className={cn("flex flex-col items-center budget-marker", budgetLevel === level && "active")}>
                <div className="emoji-container relative">
                  <div
                    className="w-16 h-16 bg-white border-3 border-black rounded-full flex items-center justify-center text-4xl cursor-pointer transition-all duration-300 hover:scale-125 hover:-translate-y-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    onClick={() => setBudgetLevel(level)}
                  >
                    {emoji}
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-600 mt-3 uppercase">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-6 bg-grid rounded-2xl border-2 border-black">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-black mt-1">info</span>
          <p className="text-sm text-black font-bold italic">
            Budget level affects how we rank recommendations, but all swaps are designed to be affordable and accessible.
          </p>
        </div>
      </div>
    </div>
  );
}

type ReviewStepProps = {
  region: string;
  selectedCuisines: string[];
  selectedAllergies: string[];
  budget: { label: string; description: string; icon: string };
  goToStep: (step: number) => void;
  isCompleting: boolean;
};

function ReviewStep({ region, selectedCuisines, selectedAllergies, budget, goToStep, isCompleting }: ReviewStepProps) {
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
    <div className="mb-4">
      <div className="mb-8">
        <h2 className="font-impact text-5xl md:text-6xl text-black mb-3 uppercase leading-tight">You're all set!</h2>
        <p className="text-slate-600 text-lg font-semibold">Review your preferences before we find your perfect swaps.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-highlight rounded-2xl border-2 border-black">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-grid border-2 border-black rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-black">public</span>
              </div>
              <h3 className="font-impact text-2xl uppercase">Your Cuisines</h3>
            </div>
            <button className="text-accent font-bold text-sm uppercase hover:underline" onClick={() => goToStep(1)}>
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-2 bg-accent text-white rounded-lg border-2 border-black font-bold text-sm" id="reviewRegion">
              {regionLabel}
            </span>
            {renderCuisinePillList(selectedCuisines)}
          </div>
        </div>

        <div className="p-6 bg-highlight rounded-2xl border-2 border-black">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent border-2 border-black rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white">emergency</span>
              </div>
              <h3 className="font-impact text-2xl uppercase">Your Constraints</h3>
            </div>
            <button className="text-accent font-bold text-sm uppercase hover:underline" onClick={() => goToStep(2)}>
              Edit
            </button>
          </div>
          <p className="text-slate-600 font-semibold" id="reviewAllergies">
            {selectedAllergies.length ? selectedAllergies.join(", ") : "No allergies selected"}
          </p>
        </div>

        <div className="p-6 bg-highlight rounded-2xl border-2 border-black">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary border-2 border-black rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white" id="reviewBudgetIcon">
                  {budget.icon}
                </span>
              </div>
              <h3 className="font-impact text-2xl uppercase">Your Budget</h3>
            </div>
            <button className="text-accent font-bold text-sm uppercase hover:underline" onClick={() => goToStep(3)}>
              Edit
            </button>
          </div>
          <p className="font-impact text-3xl text-primary mb-2" id="reviewBudgetLevel">
            {budget.label}
          </p>
          <p className="text-slate-600 font-semibold" id="reviewBudgetDesc">
            {budget.description}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-8 p-8 bg-primary text-white rounded-2xl border-3 border-black bold-shadow text-center",
          isCompleting && "animate-pulse"
        )}
      >
        <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
        </div>
        <h3 className="font-impact text-4xl mb-3 uppercase">Ready to Swap!</h3>
        <p className="text-white/90 font-semibold text-lg">We'll use these preferences to find your perfect plant-based alternatives.</p>
      </div>
    </div>
  );
}

function renderCuisinePillList(list: string[]) {
  if (!list.length) return null;
  return list.map((item) => (
    <span key={item} className="px-4 py-2 bg-white text-slate-900 rounded-lg border-2 border-black font-bold text-sm">
      {item}
    </span>
  ));
}
