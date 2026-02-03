"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
  userHref = "/preferences",
  loginLabel = "Log In",
  userLabelPrefix,
}: NavAuthButtonProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <Link href={userHref} className={combinedClassName} aria-label="Open your account">
      <span className="material-symbols-outlined text-base">account_circle</span>
      {label}
    </Link>
  );
}
