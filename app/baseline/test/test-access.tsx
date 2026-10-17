"use client";
import { useEffect, useState } from "react";
import Prototype from "@/app/advisor/baseline/prototype/prototype";
const STORAGE = "tb-baseline-design-link";
export default function TestAccess() {
  const [tester, setTester] = useState("");
  const [error, setError] = useState("");
  const [managerExample, setManagerExample] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const fragment = window.location.hash.slice(1);
      let token = fragment;
      try {
        token ||= sessionStorage.getItem(STORAGE) ?? "";
      } catch {
        /* Storage is optional. */
      }
      window.history.replaceState(null, "", window.location.pathname);
      if (!token) {
        setError("Open the private test link sent by the organiser.");
        return;
      }
      try {
        const response = await fetch("/api/baseline/design-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
        });
        const data = (await response.json()) as {
          tester?: unknown;
          error?: unknown;
        };
        if (!response.ok || typeof data.tester !== "string")
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Unable to check this link.",
          );
        if (cancelled) return;
        try {
          sessionStorage.setItem(STORAGE, token);
        } catch {
          /* Reopen the link to return. */
        }
        setTester(data.tester);
      } catch (e) {
        if (cancelled) return;
        try {
          sessionStorage.removeItem(STORAGE);
        } catch {
          /* Storage is optional. */
        }
        setError(
          e instanceof Error
            ? e.message
            : "Unable to check this link. Please try again.",
        );
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);
  if (tester)
    return (
      <>
        <section className="tb-shell">
          <label className="tb-field">
            <span>Test participant example</span>
            <select
              aria-label="Test participant example"
              value={managerExample ? "manager" : "non_manager"}
              onChange={(e) => setManagerExample(e.target.value === "manager")}
            >
              <option value="non_manager">Not a people manager</option>
              <option value="manager">Confirmed people manager</option>
            </select>
          </label>
          <p>
            This changes the example record for testing. It does not record your
            manager status. Switching examples clears your test answers.
          </p>
        </section>
        <Prototype
          key={managerExample ? "manager" : "non_manager"}
          tester={tester}
          technologyPreview
          managerRecord={{ isPeopleManager: managerExample }}
        />
      </>
    );
  return (
    <main className="tb-shell">
      <section className="tb-card">
        <h1>team.blue baseline test</h1>
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <p role="status">Checking your private test link…</p>
        )}
      </section>
    </main>
  );
}
