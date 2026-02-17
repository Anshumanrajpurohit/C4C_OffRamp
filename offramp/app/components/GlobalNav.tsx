"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/app/components/LogoMark";
import { NavAuthButton } from "@/app/components/NavAuthButton";

type GlobalNavProps = {
  enableHashNavigation?: boolean;
};

export function GlobalNav({ enableHashNavigation = false }: GlobalNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const anchorHref = (hash: string) => `${enableHashNavigation ? "#" : "/#"}${hash}`;
  const navLinkClass =
    "relative text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full";
  const comingSoonLink = (
    <Link href="/coming-soon" className={navLinkClass} prefetch={false}>
      Coming Soon
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-highlight/90 text-[#0b1c21] backdrop-blur-sm transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <LogoMark
          as={enableHashNavigation ? "anchor" : "link"}
          href={anchorHref("home")}
          hideLabel
          sizePx={180}
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
          <Link href="/about" className={navLinkClass} prefetch={false}>
            About
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white text-black md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined text-xl">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
          <NavAuthButton className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white md:flex" />
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="border-t-2 border-black bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-bold uppercase tracking-wider">
            <a href={anchorHref("home")} className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href={anchorHref("how-it-works")} className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
            <a href={anchorHref("features")} className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href={anchorHref("impact")} className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>Impact</a>
            <a href={anchorHref("institutions")} className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>Institutions</a>
            <Link href="/swap" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)}>Food Swap</Link>
            <Link href="/coming-soon" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)} prefetch={false}>Coming Soon</Link>
            <Link href="/about" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={() => setMobileMenuOpen(false)} prefetch={false}>About</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
