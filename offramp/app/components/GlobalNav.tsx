"use client";

import Link from "next/link";
import { LogoMark } from "@/app/components/LogoMark";
import { NavAuthButton } from "@/app/components/NavAuthButton";

type GlobalNavProps = {
  enableHashNavigation?: boolean;
};

export function GlobalNav({ enableHashNavigation = false }: GlobalNavProps) {
  const anchorHref = (hash: string) => `${enableHashNavigation ? "#" : "/#"}${hash}`;
  const navLinkClass =
    "relative text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full";
  const comingSoonLink = enableHashNavigation ? (
    <a href={anchorHref("coming-soon")} className={navLinkClass}>
      Coming Soon
    </a>
  ) : (
    <Link href="/coming-soon" className={navLinkClass}>
      Coming Soon
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-highlight/90 text-[#0b1c21] backdrop-blur-sm transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <LogoMark
          as={enableHashNavigation ? "anchor" : "link"}
          href={anchorHref("home")}
          textClassName="text-3xl text-[#0b1c21]"
          ariaLabel="Go to OffRamp home"
          priority
        />
        <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider md:flex">
          <div className="relative group">
            <a
              href={anchorHref("home")}
              className="relative flex items-center gap-1 text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              Home
              <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:rotate-180">
                expand_more
              </span>
            </a>
            <div className="absolute left-0 top-full z-20 mt-3 hidden min-w-[360px] rounded-2xl border-2 border-black bg-white px-2 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:block">
              <div className="absolute -top-3 left-0 right-0 h-3" />
              <div className="grid grid-cols-4 gap-2 divide-x divide-black/10">
                <a
                  href={anchorHref("how-it-works")}
                  className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                >
                  <span className="material-symbols-outlined mb-2 text-xl text-slate-500">home</span>
                  <span>How it Works</span>
                </a>
                <a
                  href={anchorHref("features")}
                  className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                >
                  <span className="material-symbols-outlined mb-2 text-xl text-slate-500">auto_graph</span>
                  <span>Features</span>
                </a>
                <a
                  href={anchorHref("impact")}
                  className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                >
                  <span className="material-symbols-outlined mb-2 text-xl text-slate-500">insights</span>
                  <span>Impact</span>
                </a>
                <a
                  href={anchorHref("institutions")}
                  className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase text-slate-700 transition hover:bg-highlight"
                >
                  <span className="material-symbols-outlined mb-2 text-xl text-slate-500">apartment</span>
                  <span>Institutions</span>
                </a>
              </div>
            </div>
          </div>
          <Link href="/swap" className={navLinkClass}>
            Food Swap
          </Link>
          {comingSoonLink}
          <a href={anchorHref("about")} className={navLinkClass}>
            About
          </a>
        </div>
        <div className="flex items-center gap-4">
          <NavAuthButton className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white sm:flex" />
        </div>
      </div>
    </nav>
  );
}
