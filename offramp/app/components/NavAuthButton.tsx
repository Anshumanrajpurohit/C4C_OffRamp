"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import whatsappLogo from "@/public/WhatsApp_Logo_green.svg-removebg-preview.png";

const DEFAULT_CLASSES =
  "hidden transform items-center gap-2 rounded-full border-2 border-black px-8 py-2 text-sm font-bold uppercase transition-all duration-300 hover:scale-105 hover:bg-black hover:text-white sm:flex";

type SessionUser = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type NavAuthButtonProps = {
  className?: string;
  loginHref?: string;
  userHref?: string;
  loginLabel?: string;
  userLabelPrefix?: string;
};

function getDisplayName(fullName: string | null, email: string | null) {
  if (fullName && fullName.trim().length > 0) {
    const [firstWord] = fullName.trim().split(/\s+/);
    return firstWord.length > 0 ? firstWord : fullName.trim();
  }

  if (email) {
    return email.split("@")[0];
  }

  return "Account";
}

export function NavAuthButton({
  className,
  loginHref = "/auth",
  userHref = "/profile",
  loginLabel = "Log In",
  userLabelPrefix,
}: NavAuthButtonProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const payload = await response.json();
        setUser(payload?.user ?? null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to load session", error);
        }
        setUser(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();
    return () => controller.abort();
  }, []);

  const combinedClassName = className ?? DEFAULT_CLASSES;
  const displayName = useMemo(
    () => getDisplayName(user?.full_name ?? null, user?.email ?? null),
    [user?.full_name, user?.email],
  );

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
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

  if (isLoading) {
    return (
      <span className={`${combinedClassName} cursor-default opacity-70`} aria-live="polite">
        Checking...
      </span>
    );
  }

  if (!user) {
    return (
      <Link href={loginHref} className={combinedClassName} aria-label="Open authentication">
        <span className="material-symbols-outlined text-base">login</span>
        {loginLabel}
      </Link>
    );
  }

  const label = userLabelPrefix ? `${userLabelPrefix} ${displayName}` : displayName;

  const handleToggleScanner = () => {
    setIsScannerOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-3">
      <div className="relative hidden sm:inline-flex">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isScannerOpen}
          aria-controls="nav-scanner-popover"
          aria-label="Show QR scanner"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-black/10 bg-white transition hover:border-[#2f6b4a] hover:bg-[#f2fbf4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b4a] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleToggleScanner();
          }}
        >
          <Image
            src={whatsappLogo}
            alt="WhatsApp assistant shortcut"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
        </button>

        {isScannerOpen && (
          <div
            id="nav-scanner-popover"
            className="absolute left-1/2 top-full z-50 mt-3 w-60 -translate-x-1/2 rounded-2xl border border-black/10 bg-white p-4 shadow-lg shadow-black/15"
            role="dialog"
            aria-label="Scan to continue"
          >
<div className="text-center mb-[12px]">
  <span></span>
  <h1>WhatsApp-Companion</h1>
</div>


            <div className="flex justify-center">
              <Image
                src="/code.png"
                alt="Scan to continue"
                width={200}
                height={200}
                className="w-full max-w-[180px] rounded-xl border border-zinc-200 bg-white p-2"
              />
            </div>
          </div>
        )}
      </div>

      <Link
        href={userHref}
        className={combinedClassName}
        aria-label="Open your account"
        onClick={() => setIsScannerOpen(false)}
      >
        <span className="material-symbols-outlined text-base">account_circle</span>
        {label}
      </Link>
    </div>
  );
}
