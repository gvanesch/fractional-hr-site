export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
export default function AdvisorIndexPage() {
  return (
    <main className="min-h-screen bg-[#F4F6FA] px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1E6FD9]">
          Van Esch
        </p>

        <h1 className="mb-2 text-3xl font-bold text-[#0A1628]">
          Advisor View
        </h1>

        <p className="mb-6 text-base text-slate-600">
          HR Operations &amp; Transformation Advisory
        </p>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-[#0A1628]">
            Lead-specific advisor links only
          </h2>
          <p className="mt-3 leading-7 text-slate-700">
            This page is no longer used for session-based advisor data.
            Open an advisor link from a lead notification email or use a URL in
            the format <span className="font-medium">/advisor/submission-id</span>.
          </p>
        </div>
      </div>
    </main>
  );
}