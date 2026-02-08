import Link from "next/link";
import type { Metadata } from "next";
import { Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import SiteNav from "@/app/components/SiteNav";
import SiteFooter from "@/app/components/SiteFooter";

const impact = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-impact" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

const tapeTiles = Array.from({ length: 8 });
const TAPE_SEAL_SRC = "/assets/coming-soon-seal.svg";

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
  return (
    <div className={`tape-strip tape-strip--${variant}`} aria-hidden="true">
      <div
        className={`tape-strip__inner tape-strip__inner--${direction}`}
        style={{ animationDuration: duration }}
      >
        {[0, 1].map((repetition) => (
          <div className="tape-strip__row" key={`${variant}-${repetition}`}>
            {tapeTiles.map((_, index) => (
              <div className="tape-strip__tile" key={`${variant}-${repetition}-${index}`}>
                <span className="tape-strip__text">COMING SOON</span>
                <img src={sealSrc} alt="" role="presentation" loading="lazy" />
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

        <section className="coming-soon-content">
          <p className="coming-soon-eyebrow">Beta channel · Wave 02</p>
          <h1 className="coming-soon-title">
            The OffRamp partner space is almost here.
            <span>We are finishing the behavioral ops toolkit.</span>
          </h1>
          <p className="coming-soon-lede">
            We are calibrating the campus and enterprise coordination tools so your kitchens can spin up plant-forward
            rotations without the guesswork. Drop your info and we will move you to the front of the invite queue.
          </p>
          <div className="coming-soon-actions">
            <Link href="/swap" className="coming-soon-btn coming-soon-btn--solid">
              Explore Current Swap Flow
            </Link>
            <Link href="mailto:hello@offramp.c4c" className="coming-soon-btn coming-soon-btn--ghost">
              Request Early Access
            </Link>
          </div>

          <div className="coming-soon-grid">
            <article className="coming-soon-card">
              <p className="coming-soon-card__label">What is baking</p>
              <h3>Predictive menu intelligence</h3>
              <p>
                Multi-week menu choreography with ingredient-level swap intelligence and purchasing guidance tied to your
                supply partner data.
              </p>
            </article>
            <article className="coming-soon-card">
              <p className="coming-soon-card__label">Why it matters</p>
              <h3>Behavioral ops dashboard</h3>
              <p>Track campus cohorts, measure carbon deltas, and convert insights directly into next-week playbooks.</p>
            </article>
            <article className="coming-soon-card">
              <p className="coming-soon-card__label">How to join</p>
              <h3>Partner concierge</h3>
              <p>
                Guided onboarding for campuses, operators, and foodservice vendors. We onboard a limited cohort every sixty days.
              </p>
            </article>
          </div>

          <dl className="coming-soon-status">
            <div>
              <dt>Gate status</dt>
              <dd>Internal QA · 82% complete</dd>
            </div>
            <div>
              <dt>First release</dt>
              <dd>Targeting March 2026</dd>
            </div>
            <div>
              <dt>Priority list</dt>
              <dd>Health systems · Universities · Venue groups</dd>
            </div>
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
