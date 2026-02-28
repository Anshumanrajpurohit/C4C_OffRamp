"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/app/components/LogoMark";
import { NavAuthButton } from "@/app/components/NavAuthButton";
import whatsappLogo from "@/public/WhatsApp_Logo_green.svg-removebg-preview.png";

export default function SiteNav() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileHomeDropdownOpen, setMobileHomeDropdownOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ id: string } | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          setSessionUser(null);
          return;
        }

        const payload = await response.json();
        setSessionUser(payload?.user?.id ? { id: payload.user.id } : null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to load session", error);
        }
        setSessionUser(null);
      } finally {
        if (!controller.signal.aborted) {
          setSessionLoaded(true);
        }
      }
    };

    loadSession();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!scannerContainerRef.current?.contains(event.target as Node)) {
        setIsScannerOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsScannerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isScannerOpen]);

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setMobileMenuOpen(false);
      router.replace("/auth");
    } catch (error) {
      console.error("Failed to log out", error);
      setIsSigningOut(false);
    }
  };

  const closeMobileMenu = () => {
    setMobileHomeDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-highlight/90 text-[#0b1c21] backdrop-blur-sm transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <LogoMark
          href="/#home"
          textClassName="text-3xl text-[#0b1c21]"
          sizePx={180}
          hideLabel
          ariaLabel="Go to OffRamp home"
          priority
        />
        <div className="hidden items-center gap-8 text-sm font-bold uppercase tracking-wider text-[#0b1c21] md:flex">
          <div className="relative group">
            <Link
              href="/#home"
              className="relative flex items-center gap-1 text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
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
            className="relative text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
          >
            Food Swap
          </Link>
          <Link
            href="/brochure"
            className="relative text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
          >
            Brochure
          </Link>
          <Link
            href="/coming-soon"
            className="relative text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
          >
            Coming Soon
          </Link>
          <Link
            href="/about"
            className="relative text-[#0b1c21] transition-colors duration-300 hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
          >
            About
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div ref={scannerContainerRef} className="relative md:hidden">
            <button
              type="button"
              aria-label="Open WhatsApp companion QR"
              aria-haspopup="dialog"
              aria-expanded={isScannerOpen}
              aria-controls="site-nav-scanner-popover"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-black/10 bg-white transition hover:border-[#2f6b4a] hover:bg-[#f2fbf4]"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsScannerOpen((prev) => !prev);
              }}
            >
              <Image src={whatsappLogo} alt="WhatsApp companion" width={24} height={24} className="h-6 w-6" />
            </button>
            {isScannerOpen && (
              <div
                id="site-nav-scanner-popover"
                role="dialog"
                aria-label="Scan WhatsApp companion QR"
                className="absolute right-0 top-full z-50 mt-3 w-60 rounded-2xl border border-black/10 bg-white p-4 shadow-lg shadow-black/15"
              >
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[#0b1c21]">
                  WhatsApp Companion
                </p>
                <Image
                  src="/code.png"
                  alt="WhatsApp companion QR code"
                  width={200}
                  height={200}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2"
                />
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-white text-black md:hidden"
            onClick={() => {
              setIsScannerOpen(false);
              setMobileMenuOpen((prev) => {
                const next = !prev;
                if (!next) {
                  setMobileHomeDropdownOpen(false);
                }
                return next;
              });
            }}
          >
            <span className="material-symbols-outlined text-xl">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
          <NavAuthButton className="hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white md:flex" />
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="border-t-2 border-black bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-bold uppercase tracking-wider">
            <div className="rounded-xl border border-black/10">
              <div className="flex items-center">
                <Link href="/#home" className="flex-1 rounded-l-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>Home</Link>
                <button
                  type="button"
                  aria-label="Toggle Home section links"
                  aria-expanded={mobileHomeDropdownOpen}
                  aria-controls="site-mobile-home-dropdown"
                  className="inline-flex items-center rounded-r-xl px-3 py-2 hover:bg-highlight"
                  onClick={() => setMobileHomeDropdownOpen((prev) => !prev)}
                >
                  <span className="material-symbols-outlined text-base">{mobileHomeDropdownOpen ? "expand_less" : "expand_more"}</span>
                </button>
              </div>
              {mobileHomeDropdownOpen && (
                <div id="site-mobile-home-dropdown" className="flex flex-col gap-1 border-t border-black/10 px-2 py-2 text-xs">
                  <Link href="/#how-it-works" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>How it Works</Link>
                  <Link href="/#features" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>Features</Link>
                  <Link href="/#impact" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>Impact</Link>
                  <Link href="/#institutions" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>Institutions</Link>
                </div>
              )}
            </div>
            <Link href="/swap" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>Food Swap</Link>
            <Link href="/brochure" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>Brochure</Link>
            <Link href="/coming-soon" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>Coming Soon</Link>
            <Link href="/about" className="rounded-xl px-3 py-2 hover:bg-highlight" onClick={closeMobileMenu}>About</Link>
            <div className="mt-2 border-t border-black/15 pt-4">
              {!sessionLoaded ? (
                <span className="inline-flex w-full items-center justify-center rounded-full border-2 border-black px-4 py-2 text-xs font-bold uppercase opacity-70">
                  Checking...
                </span>
              ) : !sessionUser ? (
                <Link
                  href="/auth"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4a] px-4 py-3 text-xs font-bold uppercase text-white transition hover:brightness-95"
                  onClick={closeMobileMenu}
                >
                  <span className="material-symbols-outlined mr-1 text-base">login</span>
                  Login
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#2f6b4a] px-4 py-3 text-xs font-bold uppercase text-white transition hover:brightness-95"
                    onClick={closeMobileMenu}
                  >
                    <span className="material-symbols-outlined mr-1 text-base">dashboard</span>
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="inline-flex w-full items-center justify-center rounded-full border-2 border-black px-4 py-3 text-xs font-bold uppercase text-black transition hover:bg-highlight disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined mr-1 text-base">logout</span>
                    {isSigningOut ? "Signing out" : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
