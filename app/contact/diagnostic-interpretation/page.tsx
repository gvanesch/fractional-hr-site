import Link from "next/link";

export default function DiagnosticInterpretationPage() {
  return (
    <main className="bg-[#F4F6FA] py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="rounded-[1.5rem] bg-white p-8 shadow-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1E6FD9]">
            Diagnostic interpretation
          </p>

          <h1 className="mb-4 text-4xl font-bold text-[#0A1628]">
            Book a free 20-minute diagnostic interpretation
          </h1>

          <p className="mb-6 text-lg text-slate-700">
            Thanks for completing the HR Operations Health Check. This short
            conversation is designed to help interpret your result, highlight
            likely sources of operational friction, and discuss practical next
            steps.
          </p>

          <div className="mb-8 rounded-xl bg-slate-50 p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              What this conversation is for
            </h2>

            <ul className="space-y-2 text-slate-700">
              <li>• Clarify what your score may indicate in practice</li>
              <li>• Explore the themes behind your lowest-scoring areas</li>
              <li>• Identify practical next steps for strengthening HR operations</li>
              <li>• Decide whether any further support would be useful</li>
            </ul>

            <p className="mt-4 text-sm text-slate-600">
              This is a free conversation with no obligation to proceed beyond it.
            </p>
          </div>

          <div className="mb-8 rounded-xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              Booking options
            </h2>

            <p className="mb-4 text-slate-700">
              You can continue to the enquiry form now. Later, this page can be
              upgraded to connect directly to a calendar booking tool such as
              Calendly or Microsoft Bookings.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-block rounded-lg bg-[#1E6FD9] px-6 py-3 text-white"
              >
                Continue to enquiry form
              </Link>

              <Link
                href="/diagnostic"
                className="inline-block rounded-lg border border-slate-300 px-6 py-3 text-slate-800"
              >
                Back to diagnostic
              </Link>
            </div>
          </div>

          <div className="text-sm text-slate-600">
            Over time, this page can be upgraded to route directly into a booking
            calendar and attach diagnostic context automatically.
          </div>
        </div>
      </div>
    </main>
  );
}