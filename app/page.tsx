"use client";

import { useState } from "react";

export default function Website() {
  const [cookieChoice, setCookieChoice] = useState<"unset" | "accepted" | "essential">("unset");

  const services = [
    {
      title: "HR Operations Advisory",
      text: "Practical advisory support to strengthen HR service delivery, workflows, governance, and operational scale.",
    },
    {
      title: "Service Delivery & Shared Services",
      text: "Design and improve HR operating models, employee support journeys, case management structures, and service catalogues.",
    },
    {
      title: "ServiceNow HRSD Optimisation",
      text: "Align HR technology, knowledge management, workflows, and automation to support scalable service delivery.",
    },
    {
      title: "Automation & AI in HR Operations",
      text: "Identify practical opportunities for automation and AI that improve efficiency without introducing unnecessary complexity.",
    },
    {
      title: "Governance & Operational Controls",
      text: "Bring structure to policies, documentation, controls, and operational discipline in growing organisations.",
    },
    {
      title: "Interim Transformation Support",
      text: "Short‑term leadership during transformation, restructuring, integration, or operational stabilisation.",
    },
  ];

  const credibility = [
    "Senior global People Operations leadership experience",
    "Deep expertise across HR service delivery and shared services",
    "Operational implementation of ServiceNow HRSD and automation",
    "Focus on scalable HR systems, workflows, and governance",
  ];

  const caseStudies = [
    {
      title: "Global HR Service Delivery Redesign",
      text: "Supported redesign of HR service delivery structures to improve efficiency, case resolution speed, and internal service experience.",
    },
    {
      title: "HR Knowledge & Workflow Optimisation",
      text: "Introduced structured knowledge management and workflow improvements to reduce HR operational friction.",
    },
    {
      title: "Automation & AI Opportunity Assessment",
      text: "Evaluated practical AI and automation use cases within HR operations to increase service efficiency.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-semibold text-slate-950">Greg van Esch</p>
            <p className="text-sm text-slate-500">HR Operations & Transformation Advisor</p>
          </div>

          <nav className="hidden gap-8 text-sm md:flex">
            <a href="#about" className="hover:text-blue-600">About</a>
            <a href="#services" className="hover:text-blue-600">Services</a>
            <a href="#case" className="hover:text-blue-600">Experience</a>
            <a href="#contact" className="hover:text-blue-600">Contact</a>
          </nav>
        </div>
      </header>

      {/* HERO */}

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-2">

          <div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              HR operations that scale with your organisation.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300">
              I help organisations modernise HR service delivery, governance, and automation so HR can operate with clarity, structure, and efficiency.
            </p>

            <div className="mt-8 flex gap-4">
              <a
                href="#contact"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                Start a Conversation
              </a>

              <a
                href="#services"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm hover:bg-white/10"
              >
                View Services
              </a>
            </div>
          </div>

          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72"
            className="rounded-2xl object-cover shadow-xl"
            alt="Modern office"
          />

        </div>
      </section>

      {/* CREDIBILITY */}

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {credibility.map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}

      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-semibold">About</h2>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="space-y-4 text-slate-700">
            <p>
              My work focuses on the operational side of HR — service delivery, workflow design, governance, and the systems that support scalable HR operations.
            </p>

            <p>
              I support organisations that need experienced guidance to modernise HR infrastructure, strengthen operational discipline, and introduce automation in practical ways.
            </p>

            <p>
              The objective is simple: HR operations that are efficient, structured, and aligned to the needs of the organisation.
            </p>
          </div>

          <img
            src="https://images.unsplash.com/photo-1556761175-4b46a572b786"
            className="rounded-xl"
            alt="Professional workspace"
          />
        </div>
      </section>

      {/* SERVICES */}

      <section id="services" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">

          <h2 className="text-3xl font-semibold">Services</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{service.text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CASE STUDIES */}

      <section id="case" className="mx-auto max-w-7xl px-6 py-20">

        <h2 className="text-3xl font-semibold">Experience</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {caseStudies.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

      </section>

      {/* CONTACT */}

      <section id="contact" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Contact</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Start a professional conversation.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Whether you are exploring HR operations advisory, transformation support, or a specific service delivery challenge, the best place to start is a short introductory discussion.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Name</label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Organisation</label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Area of interest</label>
                  <select className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500">
                    <option>HR Operations Advisory</option>
                    <option>Service Delivery & Shared Services</option>
                    <option>ServiceNow HRSD Optimisation</option>
                    <option>Automation & AI in HR Operations</option>
                    <option>Interim Transformation Support</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-200">Message</label>
                <textarea
                  rows={6}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                  placeholder="Briefly describe your organisation, challenge, or transformation objective."
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-md text-sm leading-6 text-slate-400">
                  This form is currently presented as a front-end design and can be connected to your preferred workflow, including email forwarding, Formspark, Formspree, or a CRM.
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
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Contact details</p>
                <div className="mt-5 space-y-5 text-slate-200">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</p>
                    <a href="mailto:info@vanesch.uk" className="mt-2 block text-xl font-semibold text-white hover:text-blue-300">
                      info@vanesch.uk
                    </a>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Location</p>
                    <p className="mt-2 text-base text-slate-200">Didcot, Oxfordshire, United Kingdom</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Availability</p>
                    <p className="mt-2 text-base text-slate-200">Remote advisory support, project consulting, and selected on-site engagements.</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
                <div className="border-b border-white/10 px-6 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Location</p>
                  <p className="mt-2 text-slate-300">Didcot, Oxfordshire</p>
                </div>
                <div className="h-[320px] w-full bg-slate-900">
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

      <section id="privacy" className="border-t border-slate-200 bg-white px-6 py-16 text-slate-700">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-2xl font-semibold text-slate-950">Privacy Policy</h3>
          <p className="mt-4 leading-8">
            This website may collect personal information you choose to provide, such as your name, email address, organisation, and enquiry details. This information is used solely for responding to enquiries, providing advisory information, and maintaining appropriate business records. Personal data is not sold and is only shared with service providers where necessary to operate the website or communications.
          </p>
        </div>
      </section>

      <section id="cookies" className="border-t border-slate-200 bg-slate-50 px-6 py-16 text-slate-700">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-2xl font-semibold text-slate-950">Cookie Policy</h3>
          <p className="mt-4 leading-8">
            This website uses essential technologies required for normal website function. Optional analytics or performance tools may be introduced in future to help understand traffic and improve user experience. Where non-essential cookies are used, appropriate notice and choices should be provided.
          </p>
        </div>
      </section>

      <section id="terms" className="border-t border-slate-200 bg-white px-6 py-16 text-slate-700">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-2xl font-semibold text-slate-950">Terms of Use</h3>
          <p className="mt-4 leading-8">
            The content on this website is provided for general information about advisory services and capabilities. It does not constitute legal, tax, regulatory, or employment advice unless specifically agreed in writing. Reasonable care is taken to maintain accurate content, but no guarantee is given that all information is complete, current, or suitable for every circumstance.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:justify-between">

          <div>
            <p className="font-semibold">Greg van Esch</p>
            <p className="text-sm text-slate-500">HR Operations & Transformation Advisor</p>
          </div>

          <div className="flex gap-6 text-sm">
            <a href="#privacy">Privacy Policy</a>
            <a href="#cookies">Cookie Policy</a>
            <a href="#terms">Terms</a>
          </div>

        </div>
      </footer>


      {/* COOKIE BANNER */}

      {cookieChoice === "unset" && (
        <div className="fixed bottom-6 left-6 right-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xl md:left-auto md:max-w-md">

          <p className="text-sm text-slate-700">
            This site uses essential cookies to ensure the website functions correctly. Optional analytics cookies may be used to improve the site.
          </p>

          <div className="mt-4 flex gap-3">

            <button
              onClick={() => setCookieChoice("essential")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Essential Only
            </button>

            <button
              onClick={() => setCookieChoice("accepted")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            >
              Accept Cookies
            </button>

          </div>

        </div>
      )}


    </div>
  );
}
