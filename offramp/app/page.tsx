"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";

const impact = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-impact" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

// Centralized mock metrics for future API replacement
const mockMetrics = {
  impact: {
    waterSavedML: 1.2,
    co2AvoidedTons: 450,
    dailySwaps: 1320,
    weeklyTransitions: 8420,
    mealsInfluenced: 18250,
  },
  dashboard: {
    totalSwaps: 128450,
    ecoScore: 9.2,
    progressPercent: 75,
    todaysImpact: 320,
    monthlySwaps: 28450,
    avgEcoScoreToday: 9.1,
  },
  micro: {
    liveSwapsNow: 87,
    campuses: 64,
  },
};

export default function Home() {
  const animatedElements = useRef(new WeakSet<HTMLElement>());

  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth");

    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

    const formatValue = (value: number, format?: string, suffix?: string) => {
      let formatted = String(value);
      switch (format) {
        case "fixed-1":
          formatted = value.toFixed(1);
          break;
        case "fixed-0":
          formatted = Math.round(value).toString();
          break;
        case "int":
          formatted = Math.round(value).toLocaleString();
          break;
        case "compact":
          formatted = new Intl.NumberFormat("en", {
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(Math.round(value));
          break;
        default:
          formatted = value.toString();
      }
      return `${formatted}${suffix || ""}`;
    };

    const animateCounterEl = (el: HTMLElement) => {
      if (animatedElements.current.has(el)) return;
      const target = parseFloat(el.dataset.target || "0");
      const duration = parseInt(el.dataset.duration || "2000", 10);
      const format = el.dataset.format;
      const suffix = el.dataset.suffix;
      let current = 0;
      const increment = target / Math.max(duration / 16, 1);

      const update = () => {
        current += increment;
        if (current < target) {
          el.textContent = formatValue(current, format, suffix);
          requestAnimationFrame(update);
        } else {
          el.textContent = formatValue(target, format, suffix);
          animatedElements.current.add(el);
        }
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");

          const counters = entry.target.querySelectorAll<HTMLElement>(
            ".counter, .counter-swaps, .counter-score, .counter-dashboard, .counter-micro"
          );
          counters.forEach(animateCounterEl);

          const progressBars = entry.target.querySelectorAll<HTMLElement>("[data-progress-target]");
          progressBars.forEach((bar) => {
            if (animatedElements.current.has(bar)) return;
            const targetWidth = bar.dataset.progressTarget || "75";
            setTimeout(() => {
              bar.style.width = `${targetWidth}%`;
              bar.style.transition = "width 2s ease-out";
            }, 300);
            animatedElements.current.add(bar);
          });
        }
      });
    }, observerOptions);

    const targets = document.querySelectorAll(
      ".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .impact-card, .counter-trigger, .progress-trigger"
    );
    targets.forEach((el) => observer.observe(el));

    const anchorHandler = (event: Event) => {
      const target = event.currentTarget as HTMLAnchorElement;
      if (!target?.hash) return;
      const destination = document.querySelector(target.hash);
      if (destination) {
        event.preventDefault();
        destination.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    anchors.forEach((anchor) => anchor.addEventListener("click", anchorHandler));

    return () => {
      anchors.forEach((anchor) => anchor.removeEventListener("click", anchorHandler));
      targets.forEach((el) => observer.unobserve(el));
      observer.disconnect();
      document.documentElement.classList.remove("scroll-smooth");
    };
  }, []);

  return (
    <main className={`${jakarta.className} ${impact.variable} bg-highlight text-slate-900`}>
      <nav className="sticky top-0 z-50 bg-highlight/90 backdrop-blur-sm transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="group flex items-center gap-2">
            <img
              src="/c4c.webp"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-impact text-3xl uppercase tracking-wide text-black">OffRamp</span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider md:flex">
            <a
              href="#how-it-works"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              How it Works
            </a>
            <a
              href="#features"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Features
            </a>
            <a
              href="#impact"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Impact
            </a>
            <a
              href="#institutions"
              className="relative transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Institutions
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white sm:flex"
            >
              <span className="material-symbols-outlined text-base">login</span>
              Log In
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        <div className="absolute left-10 top-20 hidden h-24 w-24 opacity-20 lg:block animate-float">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8uaXEWp98VwagctoDVdQ0iWcDwy2OUz3VMhE0Ao3PFv_6_zta9UUPpwqMCFqea-AbFgEhGyTA2JGlkQ9UKFDDFdyjNeg_QxDnhpbfDA3F9ZoIyOwbeJ_sHO5HqbeHsZUJTNrxF4s0tYrDp2Lk9SSSdWnMIoEsUxZJG37qldfMz8C7HCtNfT3xQPRLKO6L8FAvK6sSU2AgJPXw2o6dzyPyU7rnLjNfuUtI_QyO-VY3UhxzzJlnAsB8LPs3c4rbc8QRDM7ZdzpVNEmA"
            alt="Dish decoration"
            className="h-full w-full rounded-full border-2 border-black object-cover"
          />
        </div>
        <div
          className="absolute bottom-20 right-10 hidden h-32 w-32 opacity-20 lg:block"
          style={{ animation: "float 6s ease-in-out infinite", animationDelay: "1s", animationDirection: "reverse" }}
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyvMJxTIMMwc-wRM6Uoq6gZtK8VhvsEdu5kLCANQL6StiRziybbXqp5Chw1NlgSDIc2lHJdOLcX5EnJcKOYYqpri69sgrHm49vHF6nDpGNJt-wHMs-UOvIQJ5u1_lMbT2EcUKjo3TqCfc-GAc8csZh97LKggABoIGomSUEdFvwxC9aLYVZC5TMYk3VsBM_olIrA2-cXcDf2hy8Bz1ntnmnayRFrMZrdJcxjXsxfhhdXF0sNclSWAjV3xFhjsysn4dddY02Wb4QFBfM"
            alt="Dish decoration"
            className="h-full w-full rounded-full border-2 border-black object-cover"
          />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="relative z-10 space-y-8 text-center">
            <h1 className="animate-slide-up delay-100 font-impact text-6xl uppercase leading-[0.9] text-black md:text-8xl">
               LOVE THE FOOD
              <br />
              <span className="text-accent">SWAP THE REST.</span>
            </h1>
            <p className="mx-auto max-w-lg animate-slide-up delay-200 text-xl font-medium leading-relaxed text-slate-700">
              Transition to plant-based choices through familiar flavors. No pressure, just better plates. Engineered for
              institutional scale and individual taste.
            </p>
            <div className="animate-slide-up delay-300 flex flex-col items-center gap-4 pt-4">
              <button className="rounded-2xl border-2 border-black bg-black px-12 py-6 text-2xl font-black uppercase text-white transition-all duration-300 hover:scale-105 hover:bg-accent hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                Start Your Swap
              </button>
              <div className="flex items-center justify-center gap-3">
                <div className="flex">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCmXWgfmkBW0knY8iCK19eDfVdjqg9_NJP65h6LW2k3jTASn4RdjbCo4xELyCMIeGx4jO3RtiwfcXlUW7cOIaqfR4FxiiCZLrNOMJeFVMkmbHRDjQ7kJ4bh5CCwyXa-npc78dJaJ7DPqQs5YMIZa4OU1cXB6fLBW7ifYsDAGTRJOKWiAEm-68s0eTvrwsPVJ1B1tQ80r3elbuKnAFsBbnoXIjrBEn0FaGYtuhlUS7a7-9Xex1iRgepRVFJOZUY3zHs0hofs5DEY-Kd"
                    alt="Community"
                    className="h-10 w-10 rounded-full border-2 border-black object-cover"
                  />
                </div>
                <span className="text-sm font-bold uppercase tracking-tight">12k+ Swappers</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center animate-scale-in delay-400">
            <div className="relative w-full max-w-[400px] rotate-2 rounded-[3rem] border-4 border-black bg-black p-4 shadow-2xl transition-transform duration-500 hover:scale-105 hover:rotate-0">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[2.5rem] bg-white">
                <div className="flex h-full flex-col p-6">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-impact text-xl">OFFRAMP</span>
                    <span className="material-symbols-outlined">menu</span>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="group relative h-48 overflow-hidden rounded-2xl border-3 border-black">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8uaXEWp98VwagctoDVdQ0iWcDwy2OUz3VMhE0Ao3PFv_6_zta9UUPpwqMCFqea-AbFgEhGyTA2JGlkQ9UKFDDFdyjNeg_QxDnhpbfDA3F9ZoIyOwbeJ_sHO5HqbeHsZUJTNrxF4s0tYrDp2Lk9SSSdWnMIoEsUxZJG37qldfMz8C7HCtNfT3xQPRLKO6L8FAvK6sSU2AgJPXw2o6dzyPyU7rnLjNfuUtI_QyO-VY3UhxzzJlnAsB8LPs3c4rbc8QRDM7ZdzpVNEmA"
                        alt="Before"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute left-2 top-2 rounded bg-black px-3 py-1 text-[10px] font-bold text-white">BEFORE</div>
                    </div>
                    <div className="flex justify-center">
                      <div className="animate-bounce-slow rounded-full border-2 border-black bg-accent p-2 text-white">
                        <span className="material-symbols-outlined font-bold">keyboard_double_arrow_down</span>
                      </div>
                    </div>
                    <div className="group relative h-48 overflow-hidden rounded-2xl border-3 border-black">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyvMJxTIMMwc-wRM6Uoq6gZtK8VhvsEdu5kLCANQL6StiRziybbXqp5Chw1NlgSDIc2lHJdOLcX5EnJcKOYYqpri69sgrHm49vHF6nDpGNJt-wHMs-UOvIQJ5u1_lMbT2EcUKjo3TqCfc-GAc8csZh97LKggABoIGomSUEdFvwxC9aLYVZC5TMYk3VsBM_olIrA2-cXcDf2hy8Bz1ntnmnayRFrMZrdJcxjXsxfhhdXF0sNclSWAjV3xFhjsysn4dddY02Wb4QFBfM"
                        alt="After"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute left-2 top-2 rounded bg-primary px-3 py-1 text-[10px] font-bold text-white">AFTER</div>
                    </div>
                    <div className="rounded-xl border-2 border-black bg-highlight p-4 text-sm font-bold italic">
                      "Mushroom Keema: 95% texture match"
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 top-1/2 left-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-grid opacity-50 grid-pattern animate-pulse-slow" />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-reveal relative border-y-3 border-black bg-primary py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="mb-4 font-impact text-6xl uppercase tracking-tight md:text-7xl">HOW IT WORKS</h2>
            <p className="font-bold uppercase tracking-widest text-white/80">Three steps to a better plate</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bold-shadow group relative rounded-3xl border-3 border-black bg-white p-8 text-black hover-lift scroll-reveal delay-100">
              <div className="icon-badge absolute -top-9 left-8 mb-8 flex rotate-[-10deg] items-center justify-center border-2 border-black bg-grid transition-transform duration-300 group-hover:rotate-0">
                <span className="material-symbols-outlined font-black text-black">restaurant_menu</span>
              </div>
              <h3 className="mt-4 mb-4 font-impact text-4xl uppercase">1. CHOOSE</h3>
              <p className="font-semibold leading-relaxed text-slate-600">Pick the traditional dish you love from our deep cultural catalog.</p>
            </div>
            <div className="bold-shadow group relative rounded-3xl border-3 border-black bg-white p-8 text-black hover-lift scroll-reveal delay-200">
              <div className="icon-badge absolute -top-9 left-8 mb-8 flex rotate-[15deg] items-center justify-center border-2 border-black bg-accent transition-transform duration-300 group-hover:rotate-0">
                <span className="material-symbols-outlined font-black text-white">cached</span>
              </div>
              <h3 className="mt-4 mb-4 font-impact text-4xl uppercase">2. SUBSTITUTE</h3>
              <p className="font-semibold leading-relaxed text-slate-600">Our engine suggests a swap that respects every spice and texture.</p>
            </div>
            <div className="bold-shadow group relative rounded-3xl border-3 border-black bg-white p-8 text-black hover-lift scroll-reveal delay-300">
              <div className="icon-badge absolute -top-9 left-8 mb-8 flex rotate-[-5deg] items-center justify-center border-2 border-black bg-primary transition-transform duration-300 group-hover:rotate-0">
                <span className="material-symbols-outlined font-black text-white">cooking</span>
              </div>
              <h3 className="mt-4 mb-4 font-impact text-4xl uppercase">3. COOK</h3>
              <p className="font-semibold leading-relaxed text-slate-600">Follow visual guides optimized for both home cooks and chefs.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="grid-pattern border-b-3 border-black py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end scroll-reveal">
            <div className="inline-block rounded-2xl border-3 border-black bg-white p-8 transition-transform duration-300 hover:scale-105">
              <h2 className="font-impact text-5xl uppercase leading-none md:text-6xl">
                Built for Transition,
                <br />
                <span className="italic text-primary">Not Perfection</span>
              </h2>
            </div>
            <div className="flex gap-4">
              <button className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-black text-white transition-all duration-300 hover:scale-110 hover:rotate-12 hover:bg-accent">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-black text-white transition-all duration-300 hover:scale-110 hover:-rotate-12 hover:bg-accent">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="hover-lift scroll-reveal delay-100 rounded-3xl border-3 border-black bg-white p-8">
              <div className="icon-badge mb-6 flex items-center justify-center border-2 border-black bg-primary text-white transition-transform duration-300 hover:rotate-12">
                <span className="material-symbols-outlined">settings_suggest</span>
              </div>
              <h3 className="mb-3 font-impact text-2xl uppercase">Substitution Engine</h3>
              <p className="text-sm font-bold leading-relaxed text-slate-600">AI texture-mapping for the perfect spice-for-spice match.</p>
            </div>
            <div className="hover-lift scroll-reveal delay-200 rounded-3xl border-3 border-black bg-white p-8">
              <div className="icon-badge mb-6 flex items-center justify-center border-2 border-black bg-accent text-white transition-transform duration-300 hover:rotate-12">
                <span className="material-symbols-outlined">public</span>
              </div>
              <h3 className="mb-3 font-impact text-2xl uppercase">Cultural Context</h3>
              <p className="text-sm font-bold leading-relaxed text-slate-600">Preserving heritage while updating the plate for the future.</p>
            </div>
            <div className="hover-lift scroll-reveal delay-300 rounded-3xl border-3 border-black bg-white p-8">
              <div className="icon-badge mb-6 flex items-center justify-center border-2 border-black bg-black text-white transition-transform duration-300 hover:rotate-12">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <h3 className="mb-3 font-impact text-2xl uppercase">Guided Visuals</h3>
              <p className="text-sm font-bold leading-relaxed text-slate-600">Step-by-step behavioral cues for seamless habit change.</p>
            </div>
            <div className="hover-lift scroll-reveal delay-400 rounded-3xl border-3 border-black bg-white p-8">
              <div className="icon-badge mb-6 flex items-center justify-center border-2 border-black bg-primary text-white transition-transform duration-300 hover:rotate-12">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <h3 className="mb-3 font-impact text-2xl uppercase">Measured Impact</h3>
              <p className="text-sm font-bold leading-relaxed text-slate-600">Real-time stats on carbon and water saved per swap.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="scroll-reveal-left border-b-3 border-black bg-white px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 font-impact text-7xl uppercase leading-none text-black md:text-8xl">
              REAL-WORLD
              <br />
              <span className="text-accent">METRICS.</span>
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="impact-card bold-shadow rounded-[2rem] border-3 border-black bg-primary p-8 text-white hover-lift">
                <span className="material-symbols-outlined mb-4 text-5xl animate-bounce-slow">water_drop</span>
                <div
                  className="counter text-5xl font-impact uppercase"
                  data-target={mockMetrics.impact.waterSavedML}
                  data-format="fixed-1"
                  data-suffix="M L"
                >
                  0
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Million Liters Freshwater Saved</p>
              </div>
              <div className="impact-card bold-shadow rounded-[2rem] border-3 border-black bg-accent p-8 text-white hover-lift">
                <span
                  className="material-symbols-outlined mb-4 text-5xl animate-bounce-slow"
                  style={{ animationDelay: "0.5s" }}
                >
                  co2
                </span>
                <div
                  className="counter text-5xl font-impact uppercase"
                  data-target={mockMetrics.impact.co2AvoidedTons}
                  data-format="int"
                  data-suffix=" TONS"
                >
                  0
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Tons CO2 Emissions Avoided</p>
              </div>
              <div className="impact-card bold-shadow rounded-[2rem] border-3 border-black bg-secondary p-8 text-white hover-lift">
                <span className="material-symbols-outlined mb-4 text-5xl animate-bounce-slow">swap_horiz</span>
                <div
                  className="counter text-5xl font-impact uppercase"
                  data-target={mockMetrics.impact.dailySwaps}
                  data-format="int"
                  data-suffix=" DAILY"
                >
                  0
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Daily Swaps Completed</p>
              </div>
              <div className="impact-card bold-shadow rounded-[2rem] border-3 border-black bg-highlight p-8 text-black hover-lift">
                <span className="material-symbols-outlined mb-4 text-5xl animate-bounce-slow">trending_up</span>
                <div
                  className="counter text-5xl font-impact uppercase"
                  data-target={mockMetrics.impact.weeklyTransitions}
                  data-format="int"
                  data-suffix=" /WK"
                >
                  0
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-black/80">Weekly Plant-Based Transitions</p>
              </div>
              <div className="impact-card bold-shadow rounded-[2rem] border-3 border-black bg-white p-8 text-black hover-lift">
                <span className="material-symbols-outlined mb-4 text-5xl animate-bounce-slow">restaurant</span>
                <div
                  className="counter text-5xl font-impact uppercase"
                  data-target={mockMetrics.impact.mealsInfluenced}
                  data-format="int"
                  data-suffix=" MEALS"
                >
                  0
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Estimated Meals Influenced</p>
              </div>
            </div>
          </div>

          <div className="relative scroll-reveal-right">
            <div className="rounded-[3rem] border-3 border-black bg-black p-8 shadow-2xl transition-transform duration-500 hover:scale-105 hover:rotate-0 transform lg:rotate-3">
              <div className="rounded-[2rem] border-2 border-black bg-highlight p-6">
                <div className="mb-8 flex items-center justify-between border-b-2 border-black/10 pb-4">
                  <h4 className="font-impact text-2xl uppercase">Community Dashboard</h4>
                  <span className="animate-pulse-slow rounded bg-primary px-3 py-1 text-[10px] font-black uppercase text-white border-2 border-black">
                    LIVE DATA
                  </span>
                </div>
                <div className="space-y-6">
                  <div className="h-6 overflow-hidden rounded-full border-2 border-black bg-slate-200 progress-trigger">
                    <div className="progress-bar h-full w-0 rounded-full bg-accent" data-progress-target={mockMetrics.dashboard.progressPercent} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border-3 border-black bg-white p-6 transition-transform duration-300 hover:scale-105">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">TOTAL SWAPS</p>
                      <p
                        className="counter counter-swaps font-impact text-4xl text-black"
                        data-target={mockMetrics.dashboard.totalSwaps}
                        data-format="int"
                      >
                        0
                      </p>
                    </div>
                    <div className="rounded-2xl border-3 border-black bg-white p-6 transition-transform duration-300 hover:scale-105">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">ECO-SCORE</p>
                      <p
                        className="counter counter-score font-impact text-4xl text-accent"
                        data-target={mockMetrics.dashboard.ecoScore}
                        data-format="fixed-1"
                      >
                        0
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 counter-trigger">
                    <div className="rounded-2xl border-3 border-black bg-white p-4 text-center transition-transform duration-300 hover-lift">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Today's Impact</p>
                      <p
                        className="counter counter-dashboard font-impact text-3xl text-black"
                        data-target={mockMetrics.dashboard.todaysImpact}
                        data-format="int"
                        data-suffix=" kcal"
                      >
                        0
                      </p>
                    </div>
                    <div className="rounded-2xl border-3 border-black bg-white p-4 text-center transition-transform duration-300 hover-lift">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">This Month's Swaps</p>
                      <p
                        className="counter counter-dashboard font-impact text-3xl text-accent"
                        data-target={mockMetrics.dashboard.monthlySwaps}
                        data-format="int"
                      >
                        0
                      </p>
                    </div>
                    <div className="rounded-2xl border-3 border-black bg-white p-4 text-center transition-transform duration-300 hover-lift">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avg. Eco Score Today</p>
                      <p
                        className="counter counter-dashboard font-impact text-3xl text-primary"
                        data-target={mockMetrics.dashboard.avgEcoScoreToday}
                        data-format="fixed-1"
                      >
                        0
                      </p>
                    </div>
                  </div>
                </div>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDufMJacStbAFdf7Q8-89ljksa8FW-kwlZGPlLaZWYDnBhSZirOWG5YY97EKERs4JAe4Q4Nif39PxcO603XzpIqLFz-L8029eGJKUMFUs8iIHP8fQM7SBYSszsqAAqxyKi6j7Bt5zWvsgMtWqJGLlGn-F08rWd9PdgC4l0ujgZxiv30mgnSqv-ju8-n_WG_t5feEvhR7nDETEhy85-HGFMiEfg0a6gFvWgL89YNI5cGWcLSJCmcAFQ9-gqCpXA2D2gaL7NhqJGiYKdf"
                  alt="Graph visual"
                  className="mt-8 h-48 w-full rounded-2xl border-2 border-black object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="institutions" className="scroll-reveal border-y-3 border-black bg-highlight px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-impact text-6xl uppercase">INSTITUTIONAL GRADE</h2>
            <p className="font-bold uppercase tracking-widest text-slate-500">Scaleable solutions for campuses & corporations</p>
          </div>
          <div className="counter-trigger mb-10 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-600">
            <span className="material-symbols-outlined text-primary">apartment</span>
            <span
              className="counter counter-micro font-impact text-2xl text-primary"
              data-target={mockMetrics.micro.campuses}
              data-format="int"
              data-suffix=" CAMPUSES ONBOARD"
            >
              0
            </span>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            <div className="bold-shadow hover-lift scroll-reveal delay-100 flex flex-col items-center rounded-[2.5rem] border-3 border-black bg-white p-10 text-center">
              <div className="icon-badge mb-8 flex items-center justify-center border-3 border-black bg-grid transition-transform duration-300 hover:rotate-180">
                <span className="material-symbols-outlined">branding_watermark</span>
              </div>
              <h4 className="mb-4 font-impact text-3xl uppercase">White-Label</h4>
              <p className="font-semibold text-slate-600">Seamless integration into your cafeteria apps and dining ecosystem.</p>
            </div>
            <div className="bold-shadow hover-lift scroll-reveal delay-200 flex flex-col items-center rounded-[2.5rem] border-3 border-black bg-white p-10 text-center">
              <div className="icon-badge mb-8 flex items-center justify-center border-3 border-black bg-accent transition-transform duration-300 hover:rotate-180">
                <span className="material-symbols-outlined text-white">inventory_2</span>
              </div>
              <h4 className="mb-4 font-impact text-3xl uppercase">Inventory Sync</h4>
              <p className="font-semibold text-slate-600">Dynamic swap logic based on your real-time stock levels.</p>
            </div>
            <div className="bold-shadow hover-lift scroll-reveal delay-300 flex flex-col items-center rounded-[2.5rem] border-3 border-black bg-white p-10 text-center">
              <div className="icon-badge mb-8 flex items-center justify-center border-3 border-black bg-primary transition-transform duration-300 hover:rotate-180">
                <span className="material-symbols-outlined text-white">groups</span>
              </div>
              <h4 className="mb-4 font-impact text-3xl uppercase">Org Analytics</h4>
              <p className="font-semibold text-slate-600">Aggregate reports for your sustainability and ESG board meetings.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal relative overflow-hidden border-y-3 border-black bg-black py-32 text-white">
        <div className="absolute right-0 top-0 h-full w-1/3 grid-pattern opacity-10" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-12 font-impact text-7xl uppercase tracking-tighter md:text-8xl">WHY AN OFFRAMP?</h2>
          <div className="bold-shadow -rotate-1 rounded-[3rem] border-4 border-black bg-white p-12 text-black transition-transform duration-500 hover:rotate-0">
            <p className="text-3xl font-bold italic leading-tight md:text-4xl">
              "Transitions aren't made of giant leaps; they are made of accessible exits from old habits. Behavioral science is the bridge to sustainable change."
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className="h-[3px] w-12 bg-accent transition-all duration-500 hover:w-20" />
              <span className="font-impact text-xl uppercase tracking-widest text-primary">THE C4C PHILOSOPHY</span>
              <span className="h-[3px] w-12 bg-accent transition-all duration-500 hover:w-20" />
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal bg-highlight px-6 py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[4rem] border-4 border-black bg-primary p-12 text-center text-white bold-shadow md:p-24">
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-10" />
          <div className="relative z-10">
            <h2 className="mb-8 font-impact text-7xl uppercase leading-none md:text-9xl">READY TO SWAP?</h2>
            <p className="mx-auto mb-16 max-w-2xl text-xl font-bold uppercase tracking-widest text-white/80">
              Join the movement of institutions and individuals redesigning the plate.
            </p>
            <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
              <button className="w-full rounded-full border-4 border-black bg-accent px-12 py-6 text-2xl font-black uppercase text-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:w-auto">
                Try a Swap Now
              </button>
              <button className="w-full rounded-full border-4 border-black bg-white px-12 py-6 text-2xl font-black uppercase text-black transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:w-auto">
                For Institutions
              </button>
            </div>
            <div className="counter-trigger mt-8 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest text-white/80">
              <span className="material-symbols-outlined text-white">bolt</span>
              <span
                className="counter counter-micro font-impact text-2xl text-white"
                data-target={mockMetrics.micro.liveSwapsNow}
                data-format="int"
                data-suffix=" LIVE SWAPS NOW"
              >
                0
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t-3 border-black bg-white px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
          <div className="group flex items-center gap-2">
            <img
              src="/c4c.webp"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
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
            © 2024 C4C OFFRAMP. BE BOLD. EAT WELL.
          </div>
        </div>
      </footer>
    </main>
  );
}
