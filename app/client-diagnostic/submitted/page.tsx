import Link from "next/link";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClientDiagnosticSubmittedPage() {
  return (
    <main className="min-h-screen bg-[#071728]">
      <section className="px-6 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
            Client diagnostic
          </p>

          <h1 className="brand-heading-lg mt-5 text-white">
            Thank you — your diagnostic has been submitted
          </h1>

          <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
            Your responses have been securely recorded and will be included
            in the wider diagnostic analysis.
          </p>

          <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                Submission complete
              </p>

              <p className="text-base leading-7 text-slate-200">
                There is nothing further you need to do. Your response has
                been saved successfully.
              </p>

              <p className="text-base leading-7 text-slate-300">
                Your input will be considered alongside the wider diagnostic
                evidence to help build a balanced view of how people
                operations are working in practice.
              </p>

              <p className="text-base leading-7 text-slate-300">
                You can now close this browser window or return to the Van Esch
                Advisory website.
              </p>

              <div className="pt-2">
                <Link href="/" className="brand-button-primary text-center">
                  Visit vanesch.uk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
