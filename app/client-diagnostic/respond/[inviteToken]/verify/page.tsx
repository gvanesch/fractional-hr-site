"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type RequestOtpResponse = {
  success?: boolean;
  challengeId?: string;
  expiresAt?: string;
  error?: string;
  retryAfterSeconds?: number;
};

type VerifyOtpResponse = {
  success?: boolean;
  error?: string;
  attemptsRemaining?: number;
};

export default function ClientDiagnosticVerifyPage() {
  const params = useParams<{ inviteToken: string }>();
  const router = useRouter();

  const inviteToken =
    typeof params.inviteToken === "string" ? params.inviteToken : "";

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestCode() {
    setIsSending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/client-diagnostic-otp-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteToken,
        }),
      });

      const result = (await response.json()) as RequestOtpResponse;

      if (!response.ok || !result.success || !result.challengeId) {
        setError(
          result.error ??
            "We could not send a verification code. Please try again.",
        );
        return;
      }

      setChallengeId(result.challengeId);
      setOtpCode("");
      setMessage(
        "A six-digit verification code has been sent to the email address associated with this invitation.",
      );
    } catch {
      setError(
        "We could not send a verification code. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!challengeId || !/^\d{6}$/.test(otpCode)) {
      setError("Please enter the six-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/client-diagnostic-otp-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteToken,
          challengeId,
          otpCode,
        }),
      });

      const result = (await response.json()) as VerifyOtpResponse;

      if (!response.ok || !result.success) {
        const attemptsText =
          typeof result.attemptsRemaining === "number" &&
          result.attemptsRemaining > 0
            ? ` ${result.attemptsRemaining} attempt${
                result.attemptsRemaining === 1 ? "" : "s"
              } remaining.`
            : "";

        setError(
          `${result.error ?? "The verification code could not be validated."}${attemptsText}`,
        );
        return;
      }

      router.replace(`/client-diagnostic/respond/${inviteToken}`);
      router.refresh();
    } catch {
      setError(
        "The verification code could not be validated. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#071728]">
      <section className="px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
            Client diagnostic
          </p>

          <h1 className="brand-heading-lg mt-5 text-white">
            Verify your access
          </h1>

          <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
            Before continuing, we need to confirm access to the email address
            associated with this invitation.
          </p>

          <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                Email verification
              </p>

              {!challengeId ? (
                <>
                  <p className="text-base leading-7 text-slate-200">
                    We will send a six-digit verification code to the email
                    address registered for this diagnostic.
                  </p>

                  <p className="text-base leading-7 text-slate-300">
                    The code is valid for 10 minutes. For security, the email
                    address itself is not displayed on this page.
                  </p>

                  {error ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm leading-6 text-red-100"
                    >
                      {error}
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={requestCode}
                      disabled={isSending || !inviteToken}
                      className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSending
                        ? "Sending verification code..."
                        : "Send verification code"}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={verifyCode} className="space-y-5">
                  {message ? (
                    <p className="text-base leading-7 text-slate-200">
                      {message}
                    </p>
                  ) : null}

                  <div>
                    <label
                      htmlFor="otpCode"
                      className="block text-sm font-semibold text-white"
                    >
                      Verification code
                    </label>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Enter the six-digit code from the verification email.
                    </p>

                    <input
                      id="otpCode"
                      name="otpCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={otpCode}
                      onChange={(event) =>
                        setOtpCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      className="mt-4 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-3 text-xl font-semibold tracking-[0.25em] text-slate-900 shadow-sm outline-none focus:border-slate-900"
                      placeholder="000000"
                    />
                  </div>

                  {error ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-sm leading-6 text-red-100"
                    >
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isVerifying || otpCode.length !== 6}
                      className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isVerifying
                        ? "Verifying..."
                        : "Verify and continue"}
                    </button>

                    <button
                      type="button"
                      onClick={requestCode}
                      disabled={isSending}
                      className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSending ? "Sending..." : "Send a new code"}
                    </button>
                  </div>
                </form>
              )}

              <div className="border-t border-slate-700 pt-5">
                <p className="text-sm leading-6 text-slate-400">
                  If you are unable to verify your access, contact{" "}
                  <a
                    href="mailto:info@vanesch.uk"
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    info@vanesch.uk
                  </a>
                  .
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  <Link
                    href="/"
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    Return to vanesch.uk
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
