import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { GlobalNav } from "@/app/components/GlobalNav";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const heroSubtitle = "We're rebuilding the food system by respecting heritage, not erasing it.";

const valuePillars = [
  {
    icon: "psychology",
    title: "Behavior > Ideology",
    copy:
      "We map spice, aroma, and texture preferences so every swap satisfies the same reward loops as the meat-first original.",
    accentClass: "bg-[#FF6B35] text-white",
  },
  {
    icon: "visibility",
    title: "Trust & Transparency",
    copy: "No mystery meat. Every recommendation comes with sourcing, nutrition, and allergen intel.",
    accentClass: "bg-[#1E4D2B] text-white",
  },
  {
    icon: "handshake",
    title: "Partner-Ready DNA",
    copy: "We plug directly into corporate cafeterias, universities, and cloud kitchens to scale positive change fast.",
    accentClass: "bg-[#F9DC5C] text-black",
  },
];

const contactOptions = [
  {
    label: "Email Us",
    value: "impact@off-ramp.live",
    href: "mailto:hello@offramp.co",
    icon: "mail",
    shadow: "shadow-[6px_6px_0px_0px_#FF6B35]",
  },
  {
    label: "Call Us",
    value: "+91 XX XXXX XXXX",
    href: "tel:+918041235678",
    icon: "call",
    shadow: "shadow-[6px_6px_0px_0px_#F9DC5C]",
  },
  {
    label: "Visit HQ",
    value: "C4C campus,Bengaluru.",
    href: "https://maps.google.com/?q=Indiranagar+Bengaluru",
    icon: "location_on",
    shadow: "shadow-[6px_6px_0px_0px_#1E4D2B]",
  },
];

const socialLinks = [
  {
    label: "Twitter",
    href: "https://x.com",
    wrapperClass: "bg-[#F9DC5C] text-black -rotate-3",
    iconBackground: "bg-white text-black",
    icon: "alternate_email",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/offramp03",
    wrapperClass: "bg-[#FF6B35] text-white rotate-2",
    iconBackground: "bg-white text-black",
    icon: "photo_camera",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    wrapperClass: "bg-[#1E4D2B] text-white -rotate-1",
    iconBackground: "bg-white text-black",
    icon: "work",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    wrapperClass: "bg-white text-black rotate-3",
    iconBackground: "bg-[#EA4335] text-white",
    icon: "smart_display",
  },
];

export const metadata: Metadata = {
  title: "About OffRamp | Food Culture Meets Climate",
  description:
    "Discover the story behind OffRamp and how we blend behavioral science with culinary heritage to make plant-forward eating irresistible.",
};

export default function AboutPage() {
  return (
    <main className={`${bodyFont.className} bg-[#F3F0E7] text-[#0b1c21] min-h-screen w-full`}>
      <GlobalNav />

      <article className="flex flex-col">
        <section className="relative overflow-hidden px-6 pt-24 pb-20 md:pb-28">
          <div
            className="absolute inset-0 opacity-20"
            aria-hidden
            style={{ backgroundImage: "radial-gradient(#0b1c21 1px, transparent 1px)", backgroundSize: "20px 20px" }}
          />
          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="inline-block rounded-full border-2 border-black bg-white px-4 py-1 text-xs font-bold tracking-[0.3em] uppercase shadow-[4px_4px_0px_0px_#000]">
              Our Mission
            </div>
            <h1
              className={`${displayFont.className} mt-6 text-4xl font-semibold uppercase leading-tight text-[#0b1c21] sm:text-5xl md:text-6xl lg:text-7xl`}
            >
              Behavior change that <br className="hidden md:block" />
              <span className="mt-2 inline-block border-2 border-black bg-[#F9DC5C] px-3 py-1 text-[#1E4D2B]">
                tastes like home
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-[#3f3c36] md:text-xl">{heroSubtitle}</p>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-[#3f3c36]">
              OffRamp bridges the cravings we inherited with the future our planet deserves.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button className="rounded-2xl border-2 border-black bg-black px-10 py-4 text-lg font-semibold uppercase tracking-wide text-white shadow-[6px_6px_0px_0px_#000] transition hover:-translate-y-1">
                View Our Manifesto
              </button>
              <button className="flex items-center justify-center gap-2 rounded-2xl border-2 border-black bg-white px-10 py-4 text-lg font-semibold uppercase tracking-wide text-[#0b1c21] shadow-[6px_6px_0px_0px_#000] transition hover:-translate-y-1">
                <span className="material-symbols-outlined text-2xl" aria-hidden>
                  play_circle
                </span>
                Watch the Story
              </button>
            </div>
          </div>
        </section>

        <section className="border-y-2 border-black bg-[#F9DC5C] py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-black" aria-hidden />
              <img
                src="/About.png"
                alt="Behavioral chefs working together in a kitchen"
                className="relative h-96 w-full rounded-3xl border-2 border-black object-cover"
              />
            </div>
            <div>
              <p className={`${displayFont.className} text-4xl font-semibold uppercase leading-tight text-black`}>
                Born from research,
                <br /> fueled by flavor.
              </p>
              <div className="mt-6 space-y-4 text-lg text-[#2c2a25]">
                <p>
                  Everything started during our residency at Google Stitch. We studied why most sustainable diet initiatives fail and
                  learned the culprit was culture, not willpower.
                </p>
                <p>
                  OffRamp keeps the craveable parts—the spice profiles, the textures, the comfort—while upgrading the ingredients.
                  The result: swaps that feel like coming home, not giving something up.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F3F0E7] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className={`${displayFont.className} text-center text-4xl font-semibold uppercase text-[#0b1c21] md:text-5xl`}>
              What Drives Us
            </h2>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {valuePillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="flex h-full flex-col rounded-3xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000] transition hover:shadow-[10px_10px_0px_0px_#000]"
                >
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-black ${pillar.accentClass}`}>
                    <span className="material-symbols-outlined text-2xl" aria-hidden>
                      {pillar.icon}
                    </span>
                  </div>
                  <h3 className={`${displayFont.className} text-2xl font-semibold uppercase`}>{pillar.title}</h3>
                  <p className="mt-4 text-base text-[#36332c]">{pillar.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t-2 border-black bg-[#F3F0E7] py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="inline-block rounded-full border-2 border-black bg-[#1E4D2B] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              The Collective
            </div>
            <h2 className={`${displayFont.className} mt-6 text-4xl font-semibold uppercase text-[#0b1c21]`}>
              Rooted in India, thinking global.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#3a372f]">
              Our team blends food scientists, behavioral economists, and chefs. Bengaluru keeps us honest—a city where tradition and
              technology constantly remix each other.
            </p>
          </div>
        </section>

        <section className="bg-black py-24 text-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <div className="inline-block rounded-full border-2 border-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
                  Reach Out
                </div>
                <h2 className={`${displayFont.className} mt-6 text-4xl font-semibold uppercase text-white md:text-5xl`}>
                  Got a craving for change?
                </h2>
                <div className="mt-10 flex flex-col gap-8">
                  {contactOptions.map((option) => (
                    <a
                      key={option.value}
                      href={option.href}
                      target={option.href.startsWith("http") ? "_blank" : undefined}
                      rel={option.href.startsWith("http") ? "noreferrer" : undefined}
                      className="flex items-center gap-5 text-left"
                    >
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white bg-black text-white transition ${option.shadow} hover:translate-x-1 hover:translate-y-1 hover:shadow-none`}
                      >
                        <span className="material-symbols-outlined text-2xl" aria-hidden>
                          {option.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">{option.label}</p>
                        <p className={`${displayFont.className} text-2xl font-semibold`}>{option.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border-2 border-white bg-[#111] px-8 py-10 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.25)]">
                <h3 className={`${displayFont.className} text-3xl font-semibold uppercase text-white`}>
                  Join the movement online
                </h3>
                <div className="mt-10 flex flex-wrap gap-6">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-3 rounded-2xl border-2 border-black px-6 py-4 font-semibold uppercase tracking-wide shadow-[6px_6px_0px_0px_#000] transition hover:-translate-y-1 hover:rotate-0 ${link.wrapperClass}`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-black ${link.iconBackground}`}
                      >
                        <span className="material-symbols-outlined" aria-hidden>
                          {link.icon}
                        </span>
                      </span>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-white/30 pt-8 text-sm text-white/70 md:flex-row">
              <span className={`${displayFont.className} text-2xl font-semibold text-white`}>OFFRAMP</span>
              <div className="flex gap-6">
                <a href="/privacy" className="hover:text-white">Privacy Policy</a>
                <a href="/terms" className="hover:text-white">Terms of Service</a>
                <a href="/cookies" className="hover:text-white">Cookie Settings</a>
              </div>
              <span>© {new Date().getFullYear()} OffRamp Collective. All rights reserved.</span>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
