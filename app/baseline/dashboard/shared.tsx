"use client";
import { useEffect, useState } from "react";
import Dashboard from "@/app/advisor/baseline/dashboard";
import type { CompletionDashboard } from "@/lib/baseline/admin-types";
import "@/app/baseline/start/style.css";
export default function SharedDashboard() {
  const [data, setData] = useState<CompletionDashboard | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const key = "tb-baseline-dashboard",
      fragment = location.hash.slice(1);
    let token = fragment;
    try {
      token ||= sessionStorage.getItem(key) ?? "";
    } catch {}
    history.replaceState(null, "", location.pathname);
    if (!token) {
      setError("Open the private dashboard link provided by the organiser.");
      return;
    }
    async function load() {
      try {
        const r = await fetch("/api/baseline/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
        });
        const result = (await r.json()) as CompletionDashboard & {
          error?: string;
        };
        if (!r.ok)
          throw new Error(result.error ?? "Unable to load this dashboard.");
        if (cancelled) return;
        try {
          sessionStorage.setItem(key, token);
        } catch {}
        setData(result);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Unable to load this dashboard.",
          );
      }
    }
    void load();
    const timer = setInterval(() => void load(), 60000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
  return (
    <main className="tb-advisor brand-light-section">
      <div className="brand-container tb-shell tb-workspace-body">
        <header className="tb-header">
          <p className="brand-section-kicker">team.blue baseline</p>
          <span>team.blue · Baseline completion</span>
          <p>Private, read-only dashboard</p>
        </header>
        {error ? (
          <p role="alert" className="tb-error">
            {error}
          </p>
        ) : data ? (
          <Dashboard data={data} />
        ) : (
          <p role="status">Loading dashboard…</p>
        )}
      </div>
    </main>
  );
}
