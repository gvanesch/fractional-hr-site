"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AdvisorLoginFormProps = {
  nextPath: string;
  initialError?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AdvisorLoginForm({
  nextPath,
  initialError = "",
}: AdvisorLoginFormProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      let sessionEstablished = false;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session) {
          sessionEstablished = true;
          break;
        }

        await wait(200);
      }

      if (!sessionEstablished) {
        setError(
          "Login appeared to succeed, but your session was not fully established. Please try again.",
        );
        return;
      }

// Force cookie propagation before navigation
await wait(100);

// Hard reload ensures middleware sees fresh cookies
window.location.href = nextPath;

      window.location.assign(nextPath);
    } catch {
      setError("Something went wrong during login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        className="w-full rounded border p-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        disabled={isSubmitting}
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full rounded border p-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        disabled={isSubmitting}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        className="w-full rounded bg-black p-3 text-white disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}