import SiteShell from "../../components/SiteShell";

export default function ContactPage() {
  return (
    <SiteShell>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">

          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Contact
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Start a conversation
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-700">
              If you are exploring HR operations advisory, HR technology transformation,
              or building stronger HR infrastructure, feel free to get in touch.
            </p>
          </div>


          <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">

            {/* CONTACT FORM */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">

              <form
                action="https://api.web3forms.com/submit"
                method="POST"
                className="space-y-6"
              >

                {/* Web3Forms key */}
                <input
                  type="hidden"
                  name="access_key"
                  value="7788dde8-752d-47d1-afd8-41937cd93897"
                />

                {/* Optional subject */}
                <input
                  type="hidden"
                  name="subject"
                  value="New enquiry from vanesch.uk"
                />

                {/* redirect after submit */}
                <input
                  type="hidden"
                  name="redirect"
                  value="https://vanesch.uk/contact"
                />

                {/* Name */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Email */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Company */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Organisation
                  </label>

                  <input
                    type="text"
                    name="company"
                    placeholder="Company name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Topic */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Area of Interest
                  </label>

                  <select
                    name="topic"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 outline-none"
                  >
                    <option>HR Operations Advisory</option>
                    <option>HR Technology Transformation</option>
                    <option>HR Foundations for Growing Companies</option>
                    <option>M&A Integration</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Message */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message
                  </label>

                  <textarea
                    name="message"
                    required
                    rows={6}
                    placeholder="Briefly describe your organisation or challenge."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Submit */}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 transition"
                >
                  Send Enquiry
                </button>

              </form>

            </div>


            {/* CONTACT INFO */}

            <div className="space-y-8">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">

                <h3 className="text-xl font-semibold text-slate-900">
                  Contact Information
                </h3>

                <div className="mt-6 space-y-5 text-slate-700">

                  <div>
                    <p className="text-sm uppercase tracking-wider text-slate-500">
                      Email
                    </p>
                    <a
                      href="mailto:info@vanesch.uk"
                      className="text-lg font-semibold text-blue-700 hover:text-blue-800"
                    >
                      info@vanesch.uk
                    </a>
                  </div>

                  <div>
                    <p className="text-sm uppercase tracking-wider text-slate-500">
                      Location
                    </p>
                    <p className="text-base">
                      Didcot, Oxfordshire, United Kingdom
                    </p>
                  </div>

                  <div>
                    <p className="text-sm uppercase tracking-wider text-slate-500">
                      Engagement
                    </p>
                    <p className="text-base">
                      Remote advisory, transformation programmes,
                      and selected on-site engagements.
                    </p>
                  </div>

                </div>

              </div>


              {/* MAP */}

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">

                <iframe
                  src="https://www.google.com/maps?q=Didcot,Oxfordshire&output=embed"
                  className="w-full h-[320px] border-0"
                  loading="lazy"
                ></iframe>

              </div>

            </div>

          </div>

        </div>
      </section>

    </SiteShell>
  );
}