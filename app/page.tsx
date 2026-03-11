"use client";

import { useState } from "react";

export default function Website() {
  const [cookieChoice, setCookieChoice] = useState<"unset" | "accepted" | "essential">("unset");

  const stats = [
    { value: "17+", label: "Years in HR Operations" },
    { value: "27", label: "Countries Supported" },
    { value: "4,000+", label: "Employees Supported" },
    { value: "40%", label: "Reduction in Manual HR Admin" },
  ];

  const services = [
    {
      title: "HR Operations Advisory",
      text: "Advisory support to design, stabilise, and optimise HR operations across complex, scaling organisations.",
      bullets: [
        "Global HR operating models",
        "Shared services and service delivery",
        "Process architecture and governance",
      ],
    },
    {
      title: "HR Technology Transformation",
      text: "Implementation and optimisation support across HR platforms, workflow orchestration, and service delivery tooling.",
      bullets: [
        "ServiceNow HRSD",
        "HRIS integration and controls",
        "Automation and workflow design",
      ],
    },
    {
      title: "Knowledge & Service Design",
      text: "Structured knowledge, employee self-service, and service design that reduce friction and improve HR effectiveness.",
      bullets: [
        "Knowledge taxonomy and governance",
        "Service catalogues",
        "Operational documentation frameworks",
      ],
    },
  ];

  const expertise = [
    "Global People Operations leadership across regulated and complex environments",
    "ServiceNow HRSD implementation, optimisation, and workflow orchestration",
    "HR shared services design and operational governance",
    "M&A integration, TUPE, harmonisation, and global workforce transition support",
    "Compliance, controls, audit readiness, and operational risk reduction",
    "Automation and AI-ready HR operating model design",
  ];

  const caseStudies = [
    {
      title: "Transforming Global Employee Onboarding Through HR Technology Automation",
      challenge:
        "A global onboarding process had become fragmented across regions, heavily manual, and difficult to scale. The organisation needed a more structured, automated, and globally consistent operating model.",
      approach:
        "The onboarding lifecycle was redesigned using ServiceNow HR Service Delivery integrated with the HRIS. Workflows, approvals, task orchestration, and data structures were standardised to create a scalable operational system rather than a collection of disconnected tasks.",
      impact:
        "Onboarding became faster, more consistent, and more measurable across countries, with a 40% reduction in manual data input, improved data quality, stronger compliance controls, and better leadership visibility.",
      tags: ["ServiceNow HRSD", "HRIS Integration", "Automation", "Global Operations"],
    },
    {
      title: "Scaling Global HR Operations Across 27 Countries",
      challenge:
        "A growing global organisation required a stronger HR operations model capable of supporting more than 4,000 employees, contractors, and consultants across multiple jurisdictions.",
      approach:
        "The People Operations and Shared Services function was restructured to standardise core employee lifecycle processes, strengthen controls, improve governance, and create more scalable global operating rhythms.",
      impact:
        "The result was a more resilient HR service environment with clearer ownership, stronger compliance foundations, and more scalable service delivery across 27 countries.",
      tags: ["Shared Services", "Global HR", "Governance", "Operating Model"],
    },
    {
      title: "Operational Integration Through Global M&A Activity",
      challenge:
        "Following multiple transactions, the business needed to integrate HR operations, benefits, legal entities, and workforce structures while maintaining continuity and compliance.",
      approach:
        "End-to-end operational support was provided across due diligence, clean room activity, integration planning, TUPE and harmonisation workstreams, and post-close operational execution.",
      impact:
        "Multiple transactions were supported successfully, including entity consolidation, benefit harmonisation, and integration of 30+ employer entities supporting around 2,000 employees globally.",
      tags: ["M&A", "TUPE", "Integration", "Harmonisation"],
    },
  ];

  const insightCards = [
    {
      title: "HR operations should be engineered, not improvised",
      text: "When growth, compliance, and technology complexity increase, HR can no longer rely on local workarounds and institutional memory. Durable infrastructure matters.",
    },
    {
      title: "Knowledge is an operational asset",
      text: "Well-designed knowledge and self-service reduce repetitive case load, improve consistency, and create a better employee experience at scale.",
    },
    {
      title: "AI in HR needs strong foundations",
      text: "AI becomes far more useful when workflows, knowledge, and data structures are already designed well. Otherwise the glitter cannon fires into a swamp.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-950">Greg van Esch</p>
            <p className="text-sm text-slate-500">HR Operations & Transformation Advisor</p>
          </div>

          <nav className="hidden gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#services" className="transition hover:text-blue-600">Services</a>
            <a href="#case-studies" className="transition hover:text-blue-600">Case Studies</a>
            <a href="#about" className="transition hover:text-blue-600">About</a>
            <a href="#insights" className="transition hover:text-blue-600">Insights</a>
            <a href="#contact" className="transition hover:text-blue-600">Contact</a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950" />
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80"
            alt="Modern boardroom"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-32">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200">
              Advisory • HR Operations • Service Delivery • Transformation
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Building HR operations that scale with complexity, growth, and change.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              I help organisations design and strengthen HR operations, service delivery, knowledge frameworks, and HR technology platforms so they can scale with more clarity, control, and efficiency.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#services"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                View Services
              </a>
              <a
                href="#case-studies"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                View Case Studies
              </a>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">What I help with</p>
            <div className="mt-6 space-y-4 text-slate-200">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">Global HR operating models and shared services</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">ServiceNow HRSD and workflow automation</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">Knowledge management and employee self-service</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">Operational governance, compliance, and controls</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">M&A integration, harmonisation, and workforce transition</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm">
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
              <div className="mt-2 text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Services</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Specialist advisory across HR operations, service delivery, and transformation.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            This is operational consulting, not vague HR wallpaper. The focus is on systems, workflows, governance, and scalable delivery that hold together when organisations grow or change shape.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-4 leading-7 text-slate-600">{service.text}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {service.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-lg bg-slate-50 px-4 py-3">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="case-studies" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Case Studies</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Selected transformation experience.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              A few examples of the kind of work I have led across global People Operations, service delivery, and HR technology transformation.
            </p>
          </div>

          <div className="mt-10 space-y-8">
            {caseStudies.map((study) => (
              <div key={study.title} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {study.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-950">{study.title}</h3>
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Challenge</p>
                    <p className="mt-3 leading-7 text-slate-700">{study.challenge}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Approach</p>
                    <p className="mt-3 leading-7 text-slate-700">{study.approach}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Impact</p>
                    <p className="mt-3 leading-7 text-slate-700">{study.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">About</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              HR operations experience built in the real world, not just described on slides.
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-8 text-slate-700">
              <p>
                I am an HR Operations and Transformation leader with more than seventeen years of experience across global HR operations, HR technology, compliance, and workforce change. My work has consistently sat at the intersection of people, systems, process, and growth complexity.
              </p>
              <p>
                Over the course of my career I have led global People Operations supporting more than 4,000 employees, contractors, and consultants across 27 countries, while building and scaling shared services environments, improving service delivery, and strengthening operational controls.
              </p>
              <p>
                My background includes HRIS management, ServiceNow HRSD implementation, M&A integration, TUPE and harmonisation work, benefits and vendor optimisation, audit and compliance leadership, and the design of scalable employee lifecycle processes that hold together under real business pressure.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Experience Highlights</p>
            <div className="mt-6 space-y-3">
              {expertise.map((item) => (
                <div key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="insights" className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Perspective</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A few principles behind modern HR operations.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {insightCards.map((card) => (
              <div key={card.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8">
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-4 leading-7 text-slate-300">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Contact</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Start a professional conversation.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              If you are exploring HR operations advisory, service delivery redesign, knowledge architecture, or HR technology transformation, the best place to start is a short introductory discussion.
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
                  The form is currently presented as a front-end design and can be connected to your preferred workflow, such as Formspree, Formspark, or a CRM.
                </p>
                <a href="mailto:info@vanesch.uk?subject=Website%20Enquiry" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700">
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

      <section id="privacy" className="border-t border-slate-200 bg-slate-50 px-6 py-16 text-slate-700">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-2xl font-semibold text-slate-950">Privacy Policy</h3>
          <p className="mt-4 leading-8">
            This website may collect personal information that you choose to provide, such as your name, email address, organisation, and enquiry details. This information is used solely for responding to enquiries, discussing advisory services, and maintaining appropriate business records. Personal data is not sold and is only shared with service providers where necessary to operate the website or communications.
          </p>
        </div>
      </section>

      <section id="cookies" className="border-t border-slate-200 bg-white px-6 py-16 text-slate-700">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-2xl font-semibold text-slate-950">Cookie Policy</h3>
          <p className="mt-4 leading-8">
            This website uses essential technologies required for normal site function. Optional analytics or performance tools may be introduced in future to help understand traffic and improve user experience. Where non-essential cookies are used, appropriate notice and choices should be provided.
          </p>
        </div>
      </section>

      <section id="terms" className="border-t border-slate-200 bg-slate-50 px-6 py-16 text-slate-700">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-2xl font-semibold text-slate-950">Terms of Use</h3>
          <p className="mt-4 leading-8">
            The content on this website is provided for general information about advisory services and capabilities. It does not constitute legal, tax, regulatory, or employment advice unless specifically agreed in writing. Reasonable care is taken to maintain accurate content, but no guarantee is given that all information is complete, current, or suitable for every circumstance.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Greg van Esch</p>
            <p className="mt-1 text-sm text-slate-400">HR Operations & Transformation Advisor</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <a href="#privacy" className="transition hover:text-white">Privacy Policy</a>
            <a href="#cookies" className="transition hover:text-white">Cookie Policy</a>
            <a href="#terms" className="transition hover:text-white">Terms of Use</a>
            <a href="mailto:info@vanesch.uk" className="transition hover:text-white">info@vanesch.uk</a>
          </div>
        </div>
      </footer>

      {cookieChoice === "unset" && (
        <div className="fixed bottom-6 left-6 right-6 z-50 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl md:left-auto md:max-w-md">
          <p className="text-sm leading-6 text-slate-700">
            This site uses essential cookies to ensure the website functions correctly. Optional analytics may be added later to improve the experience.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setCookieChoice("essential")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
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
