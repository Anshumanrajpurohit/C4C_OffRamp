import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import SiteNav from "@/app/components/SiteNav";
import SiteFooter from "@/app/components/SiteFooter";

const impact = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-impact" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

const tapeTiles = Array.from({ length: 32 });
const TAPE_SEAL_SRC = "/seal.png";

export const metadata: Metadata = {
  title: "OffRamp | Coming Soon",
  description: "Preview the OffRamp beta experience and get notified when the partner portal unlocks.",
};

type TapeStripProps = {
  variant: "a" | "b";
  direction: "forward" | "reverse";
  duration: string;
  sealSrc: string;
};

function TapeStrip({ variant, direction, duration, sealSrc }: TapeStripProps) {
  const speedStyle: CSSProperties = { ["--tape-speed" as string]: duration };

  return (
    <div className={`tape-strip tape-strip--${variant}`} aria-hidden="true">
      <div
        className={`tape-strip__inner tape-strip__inner--${direction}`}
        style={speedStyle}
      >
        {[0, 1].map((repetition) => (
          <div className="tape-strip__row" key={`${variant}-${repetition}`}>
            {tapeTiles.map((_, index) => (
              <div className="tape-strip__tile" key={`${variant}-${repetition}-${index}`}>
                <img
                  src={sealSrc}
                  alt=""
                  role="presentation"
                  loading="lazy"
                  className="tape-strip__image"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <div className={`${jakarta.className} ${impact.variable}`}>
      <SiteNav />
      <main className="coming-soon-shell">
        <TapeStrip variant="a" direction="forward" duration="18s" sealSrc={TAPE_SEAL_SRC} />
        <TapeStrip variant="b" direction="reverse" duration="22s" sealSrc={TAPE_SEAL_SRC} />

        <section className="coming-soon-hero hero-container">
          <p className="coming-soon-eyebrow">Guided pilot channel - wave 02</p>
          <h1 className="coming-soon-title">
            Offramp is almost ready.
            <span>A smarter shift toward plant-forward food choices.</span>
          </h1>
          <p className="coming-soon-lede">
            Offramp is a web-first dish swap and discovery assistant that helps people make practical plant-forward
            decisions through personalized recommendations, budget-aware options, and measurable impact framing.
          </p>

          <div className="coming-soon-intro">
            <p>
              We are building a behavior-change product that fits real food culture: guided swaps, familiar meals, and
              low-friction nudges across web and messaging surfaces including WhatsApp.
            </p>
            <p>
              The first release is a guided early-access rollout focused on real-world learning before broader launch:
              swap quality, onboarding clarity, and everyday repeat use.
            </p>
          </div>

          <div className="coming-soon-actions">
            <Link href="/swap" className="coming-soon-btn coming-soon-btn--solid">
              Explore Current Swap Flow
            </Link>
          </div>
        </section>

        <section className="coming-soon-features features-container" aria-labelledby="coming-soon-features">
          <h2 id="coming-soon-features" className="coming-soon-section-title">FEATURES</h2>
          <div className="coming-soon-grid">
            <article className="coming-soon-card">
              <p className="coming-soon-card__label">Feature 01</p>
              <h3>Personalized dish swaps</h3>
              <p>
                Help users move toward plant-forward meals without forcing a complete lifestyle reset. Recommend
                culturally relevant alternatives based on taste, budget, and everyday eating habits.
              </p>
            </article>
            <article className="coming-soon-card">
              <p className="coming-soon-card__label">Feature 02</p>
              <h3>Guided behavior journeys</h3>
              <p>
                Turn one-off food decisions into repeatable progress with nudges, meal pathways, and lightweight
                coaching across web and messaging surfaces.
              </p>
            </article>
            <article className="coming-soon-card">
              <p className="coming-soon-card__label">Feature 03</p>
              <h3>Measurable impact signals</h3>
              <p>
                Show how small meal changes support better personal health, reduced animal harm, and lower
                environmental strain in a way that feels motivating, not overwhelming.
              </p>
            </article>
          </div>

          <dl className="coming-soon-facts">
            <div>
              <dt>Launch stage</dt>
              <dd>Guided pilot readiness - closed rollout preparation</dd>
            </div>
            <div>
              <dt>First release</dt>
              <dd>21 Feb 2026</dd>
            </div>
            <div>
              <dt>Core priorities</dt>
              <dd>Health improvement - Animal welfare - Nature protection - Behavior change - Community adoption</dd>
            </div>
          </dl>
        </section>

        <section className="coming-soon-why impact-container" aria-labelledby="why-launch-matters">
          <h2 id="why-launch-matters" className="coming-soon-section-title">WHY THIS LAUNCH MATTERS</h2>
          <div className="coming-soon-why__grid">
            <article className="coming-soon-why__card">
              <h3>For people</h3>
              <p>
                Offramp is built for people who want realistic food improvement without perfection pressure. Start
                with one better swap and build confidence over time.
              </p>
            </article>
            <article className="coming-soon-why__card">
              <h3>For institutions and communities</h3>
              <p>
                Campuses, health systems, partners, and mission-led communities can run structured behavior-change
                programs with measurable participation and adoption signals.
              </p>
            </article>
            <article className="coming-soon-why__card">
              <h3>For animals and nature</h3>
              <p>
                The platform supports reduced animal harm, more mindful consumption, and stronger outcomes for
                environmental protection and nature-positive living.
              </p>
            </article>
            <article className="coming-soon-why__card">
              <h3>For the next release cycle</h3>
              <p>
                Early release is focused on validating real usage patterns, swap quality, onboarding simplicity, and
                clear impact communication before wider rollout.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
