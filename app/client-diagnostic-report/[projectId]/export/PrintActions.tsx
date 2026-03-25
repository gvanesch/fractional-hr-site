"use client";

export default function PrintActions() {
  return (
    <div className="mb-8 flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Print / Save as PDF
      </button>

      <button
        type="button"
        onClick={() => window.close()}
        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Close
      </button>
    </div>
  );
}