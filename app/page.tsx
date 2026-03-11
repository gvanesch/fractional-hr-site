export default function FractionalHRWebsite() {
  const services = [
    {
      title: "Fractional People Operations Leadership",
      text: "Senior HR operations leadership for organisations that need experienced direction without a full-time executive hire.",
    },
    {
      title: "HR Service Delivery & Shared Services",
      text: "Design and improve HR operating models, case management, governance, service catalogues, and employee support journeys.",
    },
    {
      title: "ServiceNow HRSD & Workflow Optimisation",
      text: "Translate HR strategy into practical workflows, knowledge management, automation, and scalable service delivery.",
    },
    {
      title: "AI-Enabled HR Transformation",
      text: "Identify safe, practical ways to introduce AI into HR operations, knowledge, self-service, and process efficiency.",
    },
    {
      title: "Global Governance & Compliance Support",
      text: "Support growing organisations with process discipline, documentation, controls, and readiness for regulated environments.",
    },
    {
      title: "Transformation Projects & Interim Support",
      text: "Short-term executive support for restructuring, operating model change, post-acquisition integration, or capability build-out.",
    },
  ];

  const outcomes = [
    "More scalable HR operations without immediately adding headcount",
    "Clearer ownership, workflows, knowledge, and service governance",
    "Better employee experience through faster, simpler HR support",
    "Practical AI and automation opportunities grounded in business reality",
    "Experienced leadership during transition, growth, or operational strain",
  ];

  const idealFor = [
    "Scale-ups needing senior HR operations capability part-time",
    "Organisations modernising HR service delivery or shared services",
    "Companies implementing or improving ServiceNow HRSD",
    "Businesses preparing HR for AI-enabled ways of working",
    "Leadership teams needing experienced interim transformation support",
  ];

  const engagementModels = [
    "1–3 days per week fractional leadership",
    "Fixed-term interim transformation support",
    "Project-based HR operations and workflow advisory",
    "Strategic design workshops and operating model reviews",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-slate-300 bg-white px-4 py-1 text-sm text-slate-700 shadow-sm">
                Fractional HR & People Operations Leadership
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Senior HR operations expertise, without the full-time overhead.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                I help organisations strengthen HR service delivery, modernise operations, and implement practical automation and AI—through flexible fractional, interim, and project-based support.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#contact"
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Book an Intro Conversation
                </a>
                <a
                  href="#services"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-100"
                >
                  Explore Services
                </a>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  Fractional
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  Interim
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  Project-Based
                </div>
              </div>
            </div>

            <div className="lg:pl-10">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/70">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  Typical support areas
                </p>
                <div className="mt-6 space-y-4">
                  {[
                    "HR shared services and service delivery design",
                    "ServiceNow HRSD and knowledge governance",
                    "HR operating model improvement",
                    "AI-enabled workflow and self-service opportunities",
                    "Global process standardisation and controls",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8" id="services">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Services</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Flexible support for organisations that need capability, momentum, and calm.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Whether the challenge is growth, complexity, transformation, or simply too much important work for the current team, support can be shaped around what the business actually needs.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{service.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Outcomes</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">What this should deliver</h2>
            <div className="mt-6 space-y-4">
              {outcomes.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Ideal for</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Best suited to organisations like these</h2>
            <div className="mt-6 space-y-4">
              {idealFor.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8" id="about">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">About</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">A practical operator, not just a slide deck enthusiast.</h2>
            <div className="mt-6 space-y-5 text-slate-600 leading-8">
              <p>
                With senior global experience across People Operations, HR service delivery, governance, and transformation, I work with organisations that need experienced support to solve operational complexity in a practical way.
              </p>
              <p>
                My focus is where strategy meets execution: operating models, workflows, case management, knowledge, compliance, and the real-world application of automation and AI in HR.
              </p>
              <p>
                The aim is simple: build HR operations that are clearer, more scalable, and better aligned to the needs of the business and its people.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Engagement models</p>
            <div className="mt-6 space-y-4">
              {engagementModels.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">
                Support can be tailored from a short diagnostic engagement through to ongoing fractional leadership.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-50" id="contact">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Contact</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Need senior HR operations support, but not necessarily a full-time hire?
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Let’s have an initial conversation about your current challenges, where support is most needed, and whether a fractional or project-based model makes sense.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                  <input
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-500"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">How can I help?</label>
                  <textarea
                    rows={5}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-500"
                    placeholder="Tell me a little about your organisation, challenge, or transformation goals."
                  />
                </div>
                <button className="w-full rounded-2xl bg-slate-950 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5">
                  Send Enquiry
                </button>
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-500">
                This demo contact form is ready to be connected to your preferred form or email workflow.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}