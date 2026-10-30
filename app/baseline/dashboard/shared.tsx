"use client";
import { useEffect, useRef, useState } from "react";
import Dashboard from "@/app/advisor/baseline/dashboard";
import type { CompletionDashboard } from "@/lib/baseline/admin-types";
import "@/app/baseline/start/style.css";
export default function SharedDashboard() {
  const [data, setData] = useState<CompletionDashboard | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [hasLink, setHasLink] = useState(false);
  const refresh = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let cancelled = false,
      sequence = 0;
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
    setHasLink(true);
    async function load() {
      const request = ++sequence;
      setBusy(true);
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
        if (cancelled || request !== sequence) return;
        if (!r.ok) {
          if ([401, 403].includes(r.status)) {
            try {
              sessionStorage.removeItem(key);
            } catch {}
          }
          throw new Error(result.error ?? "Unable to load this dashboard.");
        }
        try {
          sessionStorage.setItem(key, token);
        } catch {}
        setData(result);
        setError("");
      } catch (e) {
        if (!cancelled && request === sequence) {
          setData(null);
          setError(
            e instanceof Error ? e.message : "Unable to load this dashboard.",
          );
        }
      } finally {
        if (!cancelled && request === sequence) setBusy(false);
      }
    }
    refresh.current = load;
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
          {hasLink && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh.current()}
            >
              {busy ? "Refreshing…" : "Refresh dashboard"}
            </button>
          )}
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
