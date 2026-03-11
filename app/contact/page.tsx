export default function ContactPage() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Start a conversation
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            If you are exploring HR operations advisory, HR technology transformation,
            or building stronger HR infrastructure, feel free to get in touch.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <form
              action="https://api.web3forms.com/submit"
              method="POST"
              className="space-y-6"
            >
              <input type="hidden" name="access_key" value="7788dde8-752d-47d1-afd8-41937cd93897" />
              <input type="hidden" name="subject" value="New enquiry from vanesch.uk" />
              <input type="hidden" name="redirect" value="https://vanesch.uk/contact" />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Organisation</label>
                <input
                  type="text"
                  name="company"
                  placeholder="Company name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Area of Interest</label>
                <select
                  name="topic"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option>HR Operations Advisory</option>
                  <option>HR Technology Transformation</option>
                  <option>HR Foundations for Growing Companies</option>
                  <option>M&A Integration</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Briefly describe your organisation or challenge."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Send Enquiry
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Contact Information</h3>

              <div className="mt-6 space-y-5 text-slate-700">
                <div>
                  <p className="text-sm uppercase tracking-wider text-slate-500">Email</p>
                  <a
                    href="mailto:info@vanesch.uk"
                    className="text-lg font-semibold text-blue-700 hover:text-blue-800"
                  >
                    info@vanesch.uk
                  </a>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wider text-slate-500">Location</p>
                  <p className="text-base">Didcot, Oxfordshire, United Kingdom</p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wider text-slate-500">Engagement</p>
                  <p className="text-base">
                    Remote advisory, transformation programmes, and selected on-site engagements.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <iframe
                src="https://www.google.com/maps?q=Didcot,Oxfordshire&output=embed"
                className="h-[320px] w-full border-0"
                loading="lazy"
                title="Didcot map"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}