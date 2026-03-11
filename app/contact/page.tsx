import SiteShell from "@/components/SiteShell";

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Contact</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Start a professional conversation.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              If you are exploring HR operations advisory, service delivery redesign, knowledge
              architecture, or HR technology transformation, the best place to start is a short
              introductory discussion.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                  <input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500" placeholder="Your name" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Organisation</label>
                  <input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500" placeholder="Company name" />
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500" placeholder="you@company.com" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Area of interest</label>
                  <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500">
                    <option>HR Operations Advisory</option>
                    <option>HR Technology Transformation</option>
                    <option>Knowledge & Service Design</option>
                    <option>M&A Integration Support</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  rows={6}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="Briefly describe your organisation, challenge, or transformation objective."
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-md text-sm leading-6 text-slate-500">
                  This form is currently a front-end design and can be connected to Formspree,
                  Formspark, or your preferred CRM workflow.
                </p>
                <a
                  href="mailto:info@vanesch.uk?subject=Website%20Enquiry"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Submit Enquiry
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Contact Details</p>
                <div className="mt-5 space-y-5 text-slate-700">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
                    <a href="mailto:info@vanesch.uk" className="mt-2 block text-xl font-semibold text-blue-700 hover:text-blue-800">
                      info@vanesch.uk
                    </a>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Location</p>
                    <p className="mt-2 text-base">Didcot, Oxfordshire, United Kingdom</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Engagement</p>
                    <p className="mt-2 text-base">Remote advisory support, project consulting, and selected on-site engagements.</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Location</p>
                  <p className="mt-2 text-slate-700">Didcot, Oxfordshire</p>
                </div>
                <div className="h-[320px] w-full bg-slate-200">
                  <iframe
                    title="Didcot Oxfordshire map"
                    src="https://www.google.com/maps?q=Didcot,Oxfordshire&output=embed"
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}