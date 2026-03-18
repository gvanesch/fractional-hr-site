"use client";

import { useEffect, useState } from "react";
import { loadDiagnosticState } from "../../lib/diagnostic-storage";

type Draft = {
  companySize?: string;
  industry?: string;
  role?: string;
  countryRegion?: string;
};

const DRAFT_KEY = "greg-diagnostic-draft-v1";

function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

function getInsight(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Lack of documented and repeatable processes.";
    case "Consistency":
      return "Inconsistent HR experience across teams.";
    case "Service access":
      return "Employees unclear where to go for support.";
    case "Ownership":
      return "Responsibility unclear across workflows.";
    case "Onboarding":
      return "Onboarding varies by manager.";
    case "Technology alignment":
      return "Systems not aligned to real workflows.";
    case "Knowledge and self-service":
      return "Over-reliance on HR for basic queries.";
    case "Operational capacity":
      return "HR operating reactively.";
    case "Data and handoffs":
      return "Breakdowns and duplication in processes.";
    case "Change resilience":
      return "Difficulty adapting to growth or change.";
    default:
      return "";
  }
}

function buildNarrative(result: any, draft: Draft | null): string {
  const size = draft?.companySize || "a growing organisation";

  if (result.score < 40) {
    return `This looks like an early-stage HR operating model where processes have evolved organically. At ${size}, this typically shows up as inconsistency, unclear ownership, and reliance on individuals rather than systems.`;
  }

  if (result.score < 70) {
    return `This suggests a developing HR function where structure exists but is not consistently applied. At ${size}, this often creates friction and operational inefficiency.`;
  }

  return `This reflects a relatively mature HR operation. The focus is likely optimisation, scalability, and alignment with future growth.`;
}

function buildImpact(result: any): string {
  if (result.score < 40) {
    return "High management overhead, inconsistent employee experience, and growing operational risk as the organisation scales.";
  }

  if (result.score < 70) {
    return "Hidden inefficiencies, duplication of effort, and increasing friction between teams.";
  }

  return "Opportunities to optimise efficiency, reduce cost-to-serve, and improve scalability.";
}

function buildPriorities(result: any): string[] {
  if (result.score < 40) {
    return [
      "Define and document core HR processes",
      "Clarify ownership across the employee lifecycle",
      "Establish a single entry point for HR support",
    ];
  }

  if (result.score < 70) {
    return [
      "Standardise processes across teams",
      "Improve system alignment and automation",
      "Introduce clearer service structure",
    ];
  }

  return [
    "Optimise workflows and reduce friction",
    "Enhance reporting and insights",
    "Align HR operations with strategic growth",
  ];
}

function buildCallOpener(result: any, draft: Draft | null): string {
  const size = draft?.companySize || "your organisation";

  if (result.score < 40) {
    return `From what I’ve seen, organisations at ${size} often reach a point where HR starts to feel reactive and inconsistent. I’d be interested to understand where that’s showing up most for you right now.`;
  }

  if (result.score < 70) {
    return `It looks like you’ve got some structure in place, but it’s not fully consistent yet. I’d like to explore where that’s creating friction day-to-day.`;
  }

  return `You seem to have a solid foundation in place. I’d be interested to understand where you’re seeing limitations as you scale further.`;
}

export default function AdvisorPage() {
  const [state, setState] = useState<ReturnType<typeof loadDiagnosticState>>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    setState(loadDiagnosticState());
    setDraft(loadDraft());
  }, []);

  if (!state) {
    return (
      <main className="min-h-screen bg-[#F4F6FA] px-6 py-16">
        <div className="mx-auto max-w-5xl bg-white p-8 rounded-xl shadow">
          <h1 className="text-3xl font-bold">Advisor View</h1>
          <p>No diagnostic data found.</p>
        </div>
      </main>
    );
  }

  const { result } = state;

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-8">

        <div className="bg-white p-8 rounded-xl shadow">
          <h1 className="text-3xl font-bold mb-2">Advisor View</h1>
          <p className="text-lg">
            {result.score} / 100 — {result.band.label}
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Context</h2>
          <p><strong>Company size:</strong> {draft?.companySize}</p>
          <p><strong>Industry:</strong> {draft?.industry}</p>
          <p><strong>Role:</strong> {draft?.role}</p>
          <p><strong>Region:</strong> {draft?.countryRegion}</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Diagnostic summary</h2>
          <p>{buildNarrative(result, draft)}</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Business impact</h2>
          <p>{buildImpact(result)}</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Priority actions</h2>
          <ul className="list-disc pl-5 space-y-2">
            {buildPriorities(result).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Lowest scoring areas</h2>
          {result.lowestDimensions.map((d) => (
            <div key={d.label}>
              <p><strong>{d.label}</strong> — {d.score}/5</p>
              <p className="text-sm text-gray-600">{getInsight(d.label)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Call opener</h2>
          <p>{buildCallOpener(result, draft)}</p>
        </div>

      </div>
    </main>
  );
}