"use client";

import { useState } from "react";

export default function AdvisorNav() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

      window.location.href = "/advisor/login";
    } catch (error) {
      console.error("Advisor logout error:", error);
      alert("Logout failed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <a href="/advisor" className="text-sm font-semibold text-slate-900">
            Advisor
          </a>

          <a
            href="/advisor/create-project"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Create project
          </a>

          <a
            href="/advisor/projects"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Projects
          </a>

          <a
            href="/advisor/health-checks"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Health Checks
          </a>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}