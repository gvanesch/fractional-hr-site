import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Greg van Esch",
  description:
    "Contact Greg van Esch to discuss HR operations advisory, HR technology transformation, onboarding automation, and service delivery improvement.",
};

export default function ContactPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Contact</p>
            <h1 className="brand-heading-xl mt-3">Start a conversation</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              If you are exploring HR operations advisory, HR technology transformation, or
              building stronger HR infrastructure, feel free to get in touch.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="brand-surface-soft rounded-2xl p-6 sm:p-8">
              <form
                action="https://api.web3forms.com/submit"
                method="POST"
                className="space-y-6"
              >
                <input
                  type="hidden"
                  name="access_key"
                  value="7788dde8-752d-47d1-afd8-41937cd93897"
                />
                <input
                  type="hidden"
                  name="subject"
                  value="New enquiry from vanesch.uk"
                />
                <input
                  type="hidden"
                  name="redirect"
                  value="https://vanesch.uk/contact"
                />

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Organisation
                  </label>
                  <input
                    type="text"
                    name="company"
                    placeholder="Company name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Area of Interest
                  </label>
                  <select
                    name="topic"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-blue-100"
                    defaultValue="HR Operations Advisory"
                  >
                    <option>HR Operations Advisory</option>
                    <option>HR Technology Transformation</option>
                    <option>HR Foundations for Growing Companies</option>
                    <option>M&amp;A Integration</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium text-slate-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    placeholder="Briefly describe your organisation or challenge."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1E6FD9] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  className="brand-button-primary w-full rounded-xl py-3 text-base font-medium"
                >
                  Send Enquiry
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <div className="brand-surface-soft rounded-2xl p-6 sm:p-8">
                <h2 className="brand-heading-md text-slate-900">Contact Information</h2>

                <div className="mt-6 space-y-5 text-slate-700">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-slate-500">
                      Location
                    </p>
                    <p className="mt-1 text-lg">
                      Didcot, Oxfordshire, United Kingdom
                    </p>
                  </div>

                  <div>
                    <p className="text-sm uppercase tracking-wider text-slate-500">
                      Engagement
                    </p>
                    <p className="mt-1 text-lg leading-8">
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
    </>
  );
}