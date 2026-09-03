"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  activePrefixes: string[];
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/advisor",
    label: "Advisor",
    activePrefixes: ["/advisor"],
    exact: true,
  },
  {
    href: "/advisor/create-project",
    label: "Create project",
    activePrefixes: ["/advisor/create-project"],
  },
  {
    href: "/advisor/projects",
    label: "Projects",
    activePrefixes: ["/advisor/projects", "/advisor/project/", "/advisor/report/"],
  },
  {
    href: "/advisor/explorers",
    label: "Explorers",
    activePrefixes: ["/advisor/explorers", "/advisor/explore/"],
  },
  {
    href: "/advisor/health-checks",
    label: "Health Checks",
    activePrefixes: ["/advisor/health-checks"],
  },
  {
    href: "/advisor/prospects",
    label: "Prospect CRM",
    activePrefixes: ["/advisor/prospects"],
  },
];

export default function AdvisorNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function isActive(item: NavItem): boolean {
    if (item.exact) {
      return pathname === item.href;
    }

    return item.activePrefixes.some((prefix) => pathname.startsWith(prefix));
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/advisor-logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      router.replace("/advisor/login");
      router.refresh();
    } catch (error) {
      console.error("Advisor logout error:", error);
      alert("Logout failed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-4">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Advisor">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition ${
                  active
                    ? "font-semibold text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
