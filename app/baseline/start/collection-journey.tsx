"use client";
import { useEffect, useRef, useState } from "react";
import Prototype from "@/app/advisor/baseline/prototype/prototype";
import LegacyJourney from "./journey";
import {
  isCollectionVersion,
  type CollectionDraft,
} from "@/lib/baseline/collection";
import type { ManagerRecord } from "@/lib/baseline/management-prototype";
import "./style.css";
type Saved = {
  draft: CollectionDraft;
  campaign: {
    name: string;
    privacy: string;
    closed: boolean;
    copyPreview?: boolean;
    manager: ManagerRecord;
    version: string;
  };
  revision: number;
  progress: number;
  status: string;
  updatedAt: string;
};
async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch("/api/baseline/" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await r.json()) as T & { error?: string };
  if (!r.ok)
    throw Error(
      data.error ?? "Unable to complete this request. Please try again.",
    );
  return data;
}
export default function CollectionJourney() {
  const [saved, setSaved] = useState<Saved | null>(null),
    [legacy, setLegacy] = useState(false),
    [token, setToken] = useState(""),
    [challenge, setChallenge] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const revision = useRef(0),
    last = useRef(""),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  async function load() {
    const data = await api<Saved>("response");
    if (!isCollectionVersion(data.campaign.version)) {
      setLegacy(true);
      return;
    }
    revision.current = data.revision;
    last.current = JSON.stringify({
      draft: data.draft,
      progress: data.progress,
    });
    setSaved(data);
  }
  useEffect(() => {
    let active = true;
    async function open() {
      try {
        const rawFragment = location.hash.slice(1);
        const fragment = rawFragment.split(":")[0];
        const previewChallenge = rawFragment.split(":")[1] ?? "";
        if (fragment) {
          const info = await api<{ version: string }>("invitation-info", {
            token: fragment,
          });
          if (!active) return;
          if (!isCollectionVersion(info.version)) {
            setLegacy(true);
            return;
          }
          history.replaceState(null, "", location.pathname);
          setToken(fragment);
          if (/^[a-f0-9-]{36}$/.test(previewChallenge))
            setChallenge(previewChallenge);
        } else await load();
      } catch (e) {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Open your invitation link to continue.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void open();
    return () => {
      active = false;
    };
  }, []);
  function save(draft: CollectionDraft, progress: number, submit = false) {
    const payload = JSON.stringify({ draft, progress });
    const next = queue.current
      .catch(() => {})
      .then(async () => {
        if (!submit && payload === last.current) return;
        const result = await api<{
          revision: number;
          status: string;
          copyStatus: string | null;
        }>(submit ? "submit" : "save", {
          draft,
          progress,
          revision: revision.current,
        });
        revision.current = result.revision;
        last.current = payload;
        return result;
      });
    queue.current = next;
    return next;
  }
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (legacy) return <LegacyJourney />;
  if (saved)
    return (
      <Prototype
        technologyPreview
        managerRecord={saved.campaign.manager}
        savedCollection={saved}
        saveCollection={save}
        endCollectionSession={async () => {
          await api("logout", {});
          setSaved(null);
          setError("");
          setMessage(
            "Signed out. Your answers are saved securely. Open your private invitation to return.",
          );
        }}
      />
    );
  return (
    <main className="tb-shell tb-prototype">
      <header className="tb-header">
        <span>team.blue · Current work baseline</span>
        <small>Hosted by Van Esch Advisory</small>
      </header>
      <section className="tb-card">
        <h1>Verify access</h1>
        {error && (
          <p role="alert" className="tb-error">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {loading ? (
          <p>Opening your assessment…</p>
        ) : token ? (
          <>
            <p>
              {challenge
                ? "Enter the code sent to the email address used for your invitation."
                : "We will send a verification code to the email address used for your invitation."}
            </p>
            {!challenge ? (
              <button
                className="tb-primary"
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    const r = await api<{ challenge: string }>("request-code", {
                      token,
                    });
                    setChallenge(r.challenge);
                  })
                }
              >
                Send verification code
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    await api("verify-code", { token, challenge, code });
                    setCode("");
                    setToken("");
                    await load();
                  });
                }}
              >
                <label className="tb-field">
                  <span>Verification code</span>
                  <input
                    aria-label="Verification code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
                <button className="tb-primary" disabled={busy}>
                  Verify and continue
                </button>
                <p>
                  The code is valid for 10 minutes. Use the most recent code.
                </p>
                <button
                  className="tb-secondary"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      const r = await api<{ challenge: string }>(
                        "request-code",
                        { token },
                      );
                      setChallenge(r.challenge);
                      setCode("");
                    })
                  }
                >
                  Get a current code
                </button>
              </form>
            )}
          </>
        ) : (
          <p>Open the private link in your invitation to continue.</p>
        )}
      </section>
    </main>
  );
}
