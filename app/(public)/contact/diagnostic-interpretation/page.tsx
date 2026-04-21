"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDiagnosticState } from "@/lib/diagnostic-storage";
import {
  buildAdvisorBrief,
  type DiagnosticResult,
  type SavedDiagnosticState,
} from "@/lib/diagnostic";

type InterpretationState = "loading" | "ready" | "missing";
type SendEmailState = "idle" | "sending" | "sent" | "error";

type PublicDiagnosticResultResponse =
  | {
    ok: true;
    result: DiagnosticResult;
    context: {
      companySize: string | null;
      industry: string | null;
      role: string | null;
      emailPresent: boolean;
    };
    interpretation: {
      overallAssessment: string;
      focusAreas: string[];
      whatTypicallyHappensNext: string[];
    };
  }
  | {
    ok: false;
    error: string;
  };

function buildInterpretationIntro(score: number): string {
  if (score <= 24) {
    return "This pattern suggests that some important HR foundations may still be taking shape.";
  }

  if (score <= 49) {
    return "This pattern suggests that useful foundations are in place, but they may not yet be landing consistently enough across the organisation.";
  }

  if (score <= 74) {
    return "This pattern suggests that the core HR model is reasonably well established, with clearer opportunities in refinement, consistency, and resilience.";
  }

  return "This pattern suggests that the HR model is broadly well structured, with the greatest opportunity likely to sit in optimisation, resilience, and scale-readiness.";
}

function buildInterpretationMeaning(score: number): string {
  if (score <= 24) {
    return "In practice, that often means managers and HR are working hard, but too much still depends on individual judgement, manual coordination, or locally created ways of getting things done.";
  }

  if (score <= 49) {
    return "In practice, that often means the organisation has enough structure to support delivery in many areas, but not always enough consistency to make the model feel dependable as demands increase.";
  }

  if (score <= 74) {
    return "In practice, that often means the model is working reasonably well overall, but there are still some areas where handoffs, ownership, service routes, or execution discipline could be made stronger.";
  }

  return "In practice, that often means the model is doing its job well overall, with the greatest value likely to come from focused refinement rather than foundational repair.";
}

function buildNextStepView(score: number): string {
  if (score <= 24) {
    return "The next step is usually to clarify where the current model is placing the most strain on managers, employees, and HR, then decide whether a deeper structured diagnostic would help prioritise the right improvements.";
  }

  if (score <= 49) {
    return "The next step is usually to confirm where inconsistency is most visible in practice, and whether a deeper diagnostic would help separate isolated issues from broader operating patterns.";
  }

  if (score <= 74) {
    return "The next step is usually to identify which targeted improvements would make the biggest difference, and whether a deeper diagnostic would help sharpen sequencing and focus.";
  }

  return "The next step is usually to decide whether there are enough meaningful optimisation opportunities to justify a deeper review, or whether the current model simply needs lighter-touch refinement.";
}

export default function DiagnosticInterpretationPage() {
  const [state, setState] = useState<InterpretationState>("loading");
  const [diagnosticState, setDiagnosticState] =
    useState<SavedDiagnosticState | null>(null);
  const [emailPresent, setEmailPresent] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [sendEmailState, setSendEmailState] = useState<SendEmailState>("idle");
  const [emailInput, setEmailInput] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [interpretation, setInterpretation] = useState<{
    overallAssessment: string;
    focusAreas: string[];
    whatTypicallyHappensNext: string[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("t")?.trim() ?? "";
        const storedToken =
          window.localStorage.getItem("health-check-public-token") ?? "";
        const token = urlToken || storedToken;

        if (token) {
          setAccessToken(token);

          const res = await fetch(
            `/api/public-diagnostic-result?token=${encodeURIComponent(token)}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

          const data =
            (await res.json().catch(() => null)) as
            | PublicDiagnosticResultResponse
            | null;

          if (res.ok && data?.ok) {
            setDiagnosticState({
              result: data.result,
            } as SavedDiagnosticState);
            setEmailPresent(data.context.emailPresent);
            setInterpretation(data.interpretation);
            setState("ready");
            return;
          }
        }

        const stored = loadDiagnosticState() as SavedDiagnosticState | null;

        if (!stored?.result) {
          setState("missing");
          return;
        }

        const brief = buildAdvisorBrief(stored.result);

        setDiagnosticState(stored);
        setInterpretation({
          overallAssessment: brief.overallAssessment,
          focusAreas: brief.suggestedFocusAreas,
          whatTypicallyHappensNext: brief.whatTypicallyHappensNext,
        });
        setState("ready");
      } catch (error) {
        console.error("Failed to load interpretation:", error);
        setState("missing");
      }
    }

    load();
  }, []);

  const result = diagnosticState?.result ?? null;

  const interpretationIntro = useMemo(() => {
    if (!result) return "";
    return buildInterpretationIntro(result.score);
  }, [result]);

  const interpretationMeaning = useMemo(() => {
    if (!result) return "";
    return buildInterpretationMeaning(result.score);
  }, [result]);

  const nextStepView = useMemo(() => {
    if (!result) return "";
    return buildNextStepView(result.score);
  }, [result]);

  async function handleSendEmail() {
    if (!accessToken) {
      setSendEmailState("error");
      setEmailMessage("A secure result token could not be found.");
      return;
    }

    setSendEmailState("sending");
    setEmailMessage("");

    try {
      const response = await fetch("/api/public-diagnostic-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: accessToken,
          email: emailInput,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Unable to send result email.");
      }

      setSendEmailState("sent");
      setEmailPresent(true);
      setEmailMessage("Your result has been sent.");
    } catch (error) {
      setSendEmailState("error");
      setEmailMessage(
        error instanceof Error
          ? error.message
          : "Unable to send result email.",
      );
    }
  }

  if (state === "loading") {
    return (
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="mx-auto max-w-3xl rounded-[1.5rem] bg-white p-8 shadow-sm">
            <p className="brand-body">Loading your Health Check interpretation...</p>
          </div>
        </div>
      </section>
    );
  }

  if (state === "missing" || !result) {
    return (
      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">Health Check interpretation</p>

              <h1 className="brand-heading-lg max-w-3xl text-balance text-slate-950">
                No Health Check result found.
              </h1>

              <p className="brand-body">
                This page works from a completed Health Check result. Please
                complete the Health Check first, then return here for a more
                detailed interpretation.
              </p>

              <div className="pt-2">
                <Link href="/diagnostic" className="brand-button-dark">
                  Take the Health Check
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-[#F4F6FA] pt-[calc(var(--site-header-height)+2.75rem)] sm:pt-[calc(var(--site-header-height)+3.25rem)]">
        <div className="brand-container pb-16 sm:pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
              <div className="rounded-[1.85rem] border border-slate-200 bg-white p-8 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-10">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">Health Check interpretation</p>

                  <h1 className="brand-heading-lg max-w-[34ch] text-balance text-slate-950 lg:max-w-[40ch]">
                    A more developed view of what your Health Check pattern may mean.
                  </h1>

                  <p className="brand-body-lg max-w-3xl text-slate-700">
                    This builds on your Health Check result and translates the
                    pattern into clearer operational meaning and next-step options.
                  </p>

                  <p className="brand-body max-w-3xl text-slate-600">
                    It is designed as a more developed reading of the signal, not a
                    full organisational diagnostic.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.85rem] border border-white/10 bg-[linear-gradient(135deg,#0B1F3A_0%,#102C54_55%,#163867_100%)] p-8 shadow-[0_20px_40px_rgba(2,12,27,0.24)] sm:p-10">
                <div className="brand-stack-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                    Current signal
                  </p>

                  <h2 className="max-w-[10ch] text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {result.band.label}
                  </h2>

                  <p className="text-lg font-medium text-[#C7D8EA]">
                    {result.score} / 100
                  </p>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#2D7EEA]"
                      style={{ width: `${result.score}%` }}
                    />
                  </div>

                  <p className="text-base leading-8 text-slate-200">
                    This is an indicative signal from a short structured health
                    check. It is most useful as a stronger starting point for
                    reflection and follow-up discussion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section-compact">
          <div className="mx-auto max-w-4xl">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">What this pattern may suggest</p>

              <h2 className="brand-heading-lg max-w-[34ch] text-slate-950 lg:max-w-[40ch]">
                A deeper interpretation of the result.
              </h2>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-slate-300 bg-white p-7 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:p-8">
              <div className="brand-stack-sm">
                <p className="brand-body">
                  {interpretation?.overallAssessment || interpretationIntro}
                </p>

                <p className="brand-body">{interpretationMeaning}</p>

                <p className="brand-body text-slate-600">
                  This is still an indicative read rather than a full
                  organisational diagnosis, but it is usually enough to show
                  whether the pattern is likely worth exploring in more detail.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {interpretation?.focusAreas?.length ? (
        <section className="bg-[#F4F6FA]">
          <div className="brand-container brand-section-compact">
            <div className="mx-auto max-w-4xl">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">What may be worth looking at first</p>

                <h2 className="brand-heading-lg max-w-[34ch] text-balance text-slate-950 lg:max-w-[40ch]">
                  Areas this pattern may point towards.
                </h2>

                <p className="brand-body-lg max-w-4xl text-slate-700">
                  These are not firm conclusions. They are the areas most likely
                  to benefit from closer attention based on your response pattern.
                </p>
              </div>

              <div className="mt-8 grid gap-4">
                {interpretation.focusAreas.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.25rem] border border-slate-200 bg-white px-6 py-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                  >
                    <p className="brand-body">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {interpretation?.whatTypicallyHappensNext?.length ? (
        <section className="bg-[linear-gradient(180deg,#081B33_0%,#0D2748_100%)]">
          <div className="brand-container brand-section-compact">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-[1.9rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_50px_rgba(2,12,27,0.28)] backdrop-blur-sm sm:p-10">
                <div className="brand-stack-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                    If this pattern continues
                  </p>

                  <h2 className="max-w-[34ch] text-[clamp(2rem,4.6vw,3.6rem)] font-semibold tracking-tight text-white lg:max-w-[40ch]">
                    What often becomes more visible over time.
                  </h2>

                  <p className="max-w-4xl text-lg leading-8 text-[#C7D8EA]">
                    These are common patterns that can become more noticeable if the
                    underlying model is not landing as consistently as it needs to.
                  </p>
                </div>

                <div className="mt-8 grid gap-4">
                  {interpretation.whatTypicallyHappensNext.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.2rem] border border-white/10 bg-white/7 px-6 py-5"
                    >
                      <p className="text-base leading-8 text-slate-100">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white">
        <div className="brand-container brand-section-compact">
          <div className="mx-auto max-w-4xl">
            <div className="brand-stack-sm">
              <p className="brand-section-kicker">Where attention may be most useful</p>

              <h2 className="brand-heading-lg max-w-[34ch] text-balance text-slate-950 lg:max-w-[40ch]">
                The strongest place to look first.
              </h2>

              <p className="brand-body-lg max-w-4xl text-slate-700">
                These are the lowest-scoring dimensions in your current result.
                They are not the whole story, but they are likely to be the
                strongest starting point for deeper review.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {result.lowestDimensions.map((dimension) => (
                <div
                  key={dimension.label}
                  className="flex items-center justify-between rounded-[1.15rem] border border-slate-200 bg-slate-50 px-5 py-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                >
                  <span className="text-base text-slate-800">{dimension.label}</span>
                  <span className="text-base font-semibold text-slate-700">
                    {dimension.score} / 5
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!emailPresent && accessToken ? (
        <section className="bg-[#F4F6FA]">
          <div className="brand-container brand-section-compact">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-[1.8rem] border border-slate-200 bg-white p-8 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-10">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">Send this result to your inbox</p>

                  <h2 className="brand-heading-lg max-w-[34ch] text-balance text-slate-950 lg:max-w-[40ch]">
                    Keep a copy of this interpretation.
                  </h2>

                  <p className="brand-body-lg max-w-4xl text-slate-700">
                    Add your email address and a copy of this result will be sent
                    to you.
                  </p>

                  <div className="pt-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(event) => {
                        setEmailInput(event.target.value);
                        setSendEmailState("idle");
                        setEmailMessage("");
                      }}
                      placeholder="Work email"
                      className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base leading-none text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-[#1E6FD9]/15"
                    />
                  </div>

                  <p className="brand-body-sm text-slate-500">
                    This is only used to send your result. You will not be contacted unless you request us to via the contact page. You will not be added to any mailing list and your information will not be sold.
                  </p>

                  {emailMessage ? (
                    <div
                      className={`rounded-lg px-4 py-3 text-sm ${sendEmailState === "sent"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                      {emailMessage}
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={sendEmailState === "sending"}
                      className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendEmailState === "sending"
                        ? "Sending..."
                        : "Send my result"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg max-w-[18ch] text-balance lg:max-w-[34ch]">
                  Decide whether a deeper review would now be useful.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-4xl">
                  {nextStepView}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="brand-button-primary">
                  Start a conversation
                </Link>

                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-secondary-dark"
                >
                  View Diagnostic Assessment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}