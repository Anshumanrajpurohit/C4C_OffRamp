"use client";

import { LogoMark } from "@/app/components/LogoMark";

export default function SiteFooter() {
  return (
    <footer className="border-t-3 border-black bg-white px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 sm:gap-12 md:flex-row">
        <LogoMark
          href="/#home"
          hideLabel
          textClassName="text-3xl sm:text-4xl"
          sizePx={160}
          ariaLabel="OffRamp home"
        />
        <div className="flex flex-wrap justify-center gap-4 text-center text-xs font-black uppercase tracking-[0.18em] sm:gap-8 sm:text-sm sm:tracking-widest">
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
        <div className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:tracking-[0.2em]">
          © 2026 OFFRAMP. BE BOLD. EAT WELL.
        </div>
      </div>
    </footer>
  );
}
