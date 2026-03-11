"use client";

export default function FractionalHRWebsite() {
  const services = [
    {
      title: "Fractional HR Operations Leadership",
      text: "Senior operational leadership for organisations that need experienced direction, structure, and momentum without making a full-time executive hire.",
    },
    {
      title: "HR Service Delivery & Shared Services",
      text: "Design and improve HR operating models, case management, employee support journeys, service catalogues, governance, and hand-offs across teams.",
    },
    {
      title: "ServiceNow HRSD & Workflow Optimisation",
      text: "Translate HR strategy into practical workflows, knowledge management, automation, and scalable service delivery that works in the real world.",
    },
    {
      title: "AI-Enabled HR Transformation",
      text: "Identify practical, low-drama uses of AI in HR operations, self-service, knowledge, triage, and process efficiency, grounded in risk-aware implementation.",
    },
    {
      title: "Governance, Compliance & Controls",
      text: "Bring structure to documentation, policies, controls, audit readiness, and operational discipline for growing and increasingly complex organisations.",
    },
    {
      title: "Interim & Transformation Support",
      text: "Short-term leadership for transformation programmes, operating model redesign, post-acquisition integration, service stabilisation, or capability build-out.",
    },
  ];

  const proofPoints = [
    "Senior global People Operations leadership",
    "Deep experience in HR service delivery, governance, and shared services",
    "Practical expertise across ServiceNow HRSD, knowledge, workflow, and automation",
    "Strong focus on scalable operating models, controls, and real-world execution",
  ];

  const outcomes = [
    "More scalable HR operations without immediately adding senior headcount",
    "Clearer ownership, workflows, knowledge, and service governance",
    "Faster, simpler employee support through better service design",
    "Practical automation and AI opportunities grounded in business reality",
    "Experienced leadership during growth, change, or operational strain",
  ];

  const idealFor = [
    "Scale-ups needing experienced HR operations capability on a part-time basis",
    "Organisations modernising HR service delivery or shared services",
    "Businesses implementing or improving ServiceNow HRSD",
    "Leadership teams preparing HR for more automated and AI-enabled ways of working",
    "Companies needing calm interim support during operational change",
  ];

  const engagementModels = [
    "1–3 days per week fractional leadership",
    "Fixed-term interim transformation support",
    "Project-based HR operations and workflow advisory",
    "Strategic design workshops and operational reviews",
  ];

  const insights = [
    {
      title: "HR operations should feel simple on the surface",
      text: "Behind every smooth employee experience sits a lot of careful service design, governance, workflow, and operational discipline. The goal is not complexity. It is well-engineered simplicity.",
    },
    {
      title: "Automation should remove friction, not add theatre",
      text: "The best automation work is often gloriously unglamorous: cleaner routing, better knowledge, smarter triage, and less manual churn. That is where real efficiency tends to live.",
    },
    {
      title: "AI in HR needs operational realism",
      text: "Used well, AI can improve speed, consistency, and self-service. Used badly, it creates noise and risk. Sensible design, controls, and implementation matter more than shiny claims.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="#home" className="text-lg font-semibold tracking-tight text-slate-950">
            Greg van Esch
          </a>
          <nav className="hidden gap-8 text-sm text-slate-700 md:flex">
            <a href="#about" className="transition hover:text-blue-700">About</a>
            <a href="#services" className="transition hover:text-blue-700">Services</a>
            <a href="#approach" className="transition hover:text-blue-700">Approach</a>
            <a href="#insights" className="transition hover:text-blue-700">Insights</a>
            <a href="#contact" className="transition hover:text-blue-700">Contact</a>
          </nav>
          <a
            href="mailto:info@vanesch.uk"
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            info@vanesch.uk
          </a>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1 text-sm text-slate-200">
              Fractional HR Operations • Service Delivery • Transformation
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Operationally strong HR, without the full-time overhead.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              I help organisations modernise HR service delivery, improve operational scale, strengthen governance, and apply automation and AI in practical ways that actually work.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-900/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Book an Intro Conversation
              </a>
              <a
                href="#services"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Explore Services
              </a>
            </div>
            <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
              {proofPoints.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
              <img
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
                alt="Modern, professional office interior"
                className="h-full min-h-[420px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Positioning</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Specialist support across HR operations, service delivery, workflow, governance, and AI-enabled transformation.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Engagement</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Fractional, interim, or project-based support shaped around operational need rather than consulting theatre.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contact</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Email <a className="font-medium text-blue-700" href="mailto:info@vanesch.uk">info@vanesch.uk</a> to start a conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">About</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A practical operator, not just another consultant with an allergy to execution.
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-8 text-slate-700">
              <p>
                I work with organisations that need experienced support to solve operational complexity in HR in a practical, structured way. My focus is where strategy meets delivery: service design, operating models, workflows, case management, knowledge, controls, and the sensible application of automation and AI.
              </p>
              <p>
                This is not generic HR consulting. It is targeted support for organisations that need HR to function more clearly, scale more effectively, and deliver a better internal service experience.
              </p>
              <p>
                The aim is simple: build HR operations that are stronger, calmer, more scalable, and better aligned to the needs of the business and its people.
              </p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Typical support areas</p>
            <div className="mt-6 space-y-4">
              {[
                "HR shared services and service delivery design",
                "Operating model improvement and workflow clarity",
                "ServiceNow HRSD and knowledge governance",
                "Case management, service catalogues, and employee support journeys",
                "Automation, AI opportunities, and operational controls",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Services</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Flexible support for organisations that need capability, structure, and momentum.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Whether the challenge is growth, complexity, transformation, or simply too much important work for the current team, support can be shaped around what the business actually needs.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold text-slate-950">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{service.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Approach</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Designed for businesses that want useful progress, not consulting fog.
            </h2>
            <div className="mt-6 space-y-4">
              {outcomes.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Best suited to</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Organisations facing real operational work, not just abstract ambition.
            </h2>
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

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Engagement models</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Support can be shaped around what the business actually needs.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                Some organisations need steady fractional input. Others need short, targeted intervention. The model should serve the problem, not the other way around.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {engagementModels.map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="insights" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Perspective</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            A few principles that tend to matter in HR operations.
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {insights.map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Contact</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Need experienced HR operations support, but not necessarily a full-time hire?
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Start with an introductory conversation about your current challenge, where support is most needed, and whether a fractional, interim, or project-based model makes sense.
            </p>
            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Enquiries</p>
              <a href="mailto:info@vanesch.uk" className="mt-3 block text-2xl font-semibold text-blue-700">
                info@vanesch.uk
              </a>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Email is the simplest way to start. A brief note on your organisation, current challenge, and timeline is enough.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                <input
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">How can I help?</label>
                <textarea
                  rows={5}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                  placeholder="Tell me a little about your organisation, challenge, or transformation goals."
                />
              </div>
              <a
                href="mailto:info@vanesch.uk?subject=Website%20enquiry"
                className="block w-full rounded-2xl bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Send Enquiry
              </a>
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              This contact area is ready to be connected to your preferred form workflow or booking tool.
            </p>
          </div>
        </div>
      </section>

      <section id="privacy-policy" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Privacy Policy</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Privacy Policy</h2>
          <div className="mt-8 space-y-6 text-slate-700 leading-8">
            <p>
              This website is operated by Greg van Esch. If you contact the business through this website or by email, personal data such as your name, email address, organisation details, and the contents of your enquiry may be collected and processed.
            </p>
            <p>
              This information is used only for legitimate business purposes, including responding to enquiries, communicating about potential services, maintaining appropriate business records, and operating and improving the website.
            </p>
            <p>
              Personal data is not sold. Information may be shared with trusted service providers where reasonably necessary to host the website, manage email, or support standard business operations.
            </p>
            <p>
              Personal data is kept only for as long as reasonably necessary for the purpose for which it was collected, or as required by law.
            </p>
            <p>
              You may request access to, correction of, or deletion of your personal data, subject to applicable legal requirements. Privacy enquiries can be directed to <a className="text-blue-700" href="mailto:info@vanesch.uk">info@vanesch.uk</a>.
            </p>
          </div>
        </div>
      </section>

      <section id="cookie-policy" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Cookie Policy</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Cookie Policy</h2>
          <div className="mt-8 space-y-6 text-slate-700 leading-8">
            <p>
              This website may use cookies or similar technologies that are necessary for the website to function, improve performance, understand traffic, and support a better user experience.
            </p>
            <p>
              Essential cookies may be used to enable core site functionality. If analytics or other non-essential cookies are introduced, visitors should be informed and given appropriate choices where legally required.
            </p>
            <p>
              You can usually control or delete cookies through your browser settings. Disabling some cookies may affect how parts of the website function.
            </p>
            <p>
              Questions about cookies or website data use can be sent to <a className="text-blue-700" href="mailto:info@vanesch.uk">info@vanesch.uk</a>.
            </p>
          </div>
        </div>
      </section>

      <section id="terms" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Terms of Use</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Terms of Use</h2>
          <div className="mt-8 space-y-6 text-slate-700 leading-8">
            <p>
              The content on this website is provided for general information about services and capabilities. It does not constitute legal, regulatory, tax, employment, or other professional advice unless specifically agreed in writing.
            </p>
            <p>
              While reasonable care is taken to keep the content accurate and up to date, no guarantee is given that all information is complete, current, or suitable for every circumstance.
            </p>
            <p>
              All intellectual property rights in the content, branding, text, and design of this website are reserved unless otherwise stated.
            </p>
            <p>
              Use of this website is subject to applicable law. Any enquiries about these terms can be sent to <a className="text-blue-700" href="mailto:info@vanesch.uk">info@vanesch.uk</a>.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-lg font-semibold text-white">Greg van Esch</p>
            <p className="mt-1 text-sm text-slate-400">Fractional HR Operations & Transformation Leadership</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <a href="#privacy-policy" className="transition hover:text-white">Privacy Policy</a>
            <a href="#cookie-policy" className="transition hover:text-white">Cookie Policy</a>
            <a href="#terms" className="transition hover:text-white">Terms of Use</a>
            <a href="mailto:info@vanesch.uk" className="transition hover:text-white">info@vanesch.uk</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
