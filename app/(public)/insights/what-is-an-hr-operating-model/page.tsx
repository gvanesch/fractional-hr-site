import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is an HR Operating Model? A Practical Guide",
  description:
    "A practical guide to HR operating models: what they are, how they work, the core design choices, signs the model is not scaling, and where to start.",
};

const modelComponents = [
  {
    title: "Process and consistency",
    text: "How core employee lifecycle and service processes are defined, where standardisation matters, and how consistently the same situations are handled across teams, locations, and managers.",
  },
  {
    title: "Ownership and decision rights",
    text: "Who owns each process, who makes which decisions, what managers are expected to handle, and where escalation or specialist input is required.",
  },
  {
    title: "Service access and case management",
    text: "How employees and managers ask for help, how work is routed and tracked, what should be self-service, and when a case needs active HR involvement.",
  },
  {
    title: "Roles, capacity, and capability",
    text: "How work is divided across operational HR, business partnering, specialist teams, local HR, shared services, and leadership, with enough capacity and capability to make the model work in practice.",
  },
  {
    title: "Technology and workflow",
    text: "How HR systems support the intended process, reduce manual handoffs, provide the right controls, and create a usable experience for employees, managers, and HR teams.",
  },
  {
    title: "Knowledge and self-service",
    text: "How policies, guidance, process information, and manager support are maintained so routine questions can be answered accurately without unnecessary escalation.",
  },
  {
    title: "Data and handoffs",
    text: "How information moves between people, systems, teams, and countries, including who is accountable for data quality and where rekeying or manual reconciliation creates risk.",
  },
  {
    title: "Governance and improvement",
    text: "How service performance, risks, exceptions, controls, and improvement priorities are reviewed so the operating model can evolve rather than gradually fragment again.",
  },
];

const strainSignals = [
  "Managers receive different answers to similar questions.",
  "The same HR activity is handled differently by team, country, or individual.",
  "Employees are unclear about where to go for support.",
  "Shared inboxes, spreadsheets, and manual follow-ups carry too much of the service.",
  "HR technology exists, but important work still happens around the system rather than through it.",
  "Ownership is unclear when a case crosses HR, payroll, managers, or specialist teams.",
  "Local workarounds have multiplied because the standard process no longer fits the reality of the business.",
  "HR capacity is absorbed by repeat questions, corrections, and exceptions rather than improvement work.",
];

const assessmentQuestions = [
  "Can managers and employees tell where they should go for different types of HR support?",
  "Are the most important HR processes understood and followed consistently?",
  "Is ownership clear from request through to resolution, including handoffs and escalations?",
  "Does technology support the intended process, or are people compensating with manual workarounds?",
  "Can HR see demand, service performance, recurring failure points, and where capacity is being consumed?",
  "Is there a deliberate view of what should be standard across the organisation and what genuinely needs local variation?",
];

export default function HrOperatingModelArticlePage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-5xl">
            <p className="brand-kicker">HR Operations Insights</p>
            <h1 className="brand-heading-xl mt-3">
              What Is an HR Operating Model? A Practical Guide for Growing and
              Complex Organisations
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-4xl">
              An HR operating model is the practical blueprint for how HR work
              gets done. It connects structure, process, ownership, service
              delivery, technology, knowledge, data, and governance so the
              function can operate consistently as the organisation changes.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <article className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 lg:p-8">
              <p className="brand-section-kicker">In simple terms</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                An HR operating model defines how the People function turns
                intent into repeatable delivery.
              </h2>
              <div className="brand-body mt-5 space-y-4">
                <p>
                  It describes how HR services are organised and delivered, who
                  owns the work, how employees and managers access support, how
                  decisions are made, what technology enables, how information
                  moves, and how performance is governed.
                </p>
                <p>
                  The organisation chart is part of that picture, but it is not
                  the operating model on its own.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <p className="brand-section-kicker">The distinction</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                An HR operating model is more than an HR structure.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  It is possible to redesign reporting lines without changing
                  how HR actually works. A business can have HR business
                  partners, specialist teams, local HR, or a shared service
                  centre on an organisation chart and still rely on unclear
                  processes, inconsistent service routes, manual handoffs, and
                  individual knowledge to get work completed.
                </p>
                <p>
                  A useful operating model goes further. It connects the
                  structure to the work that needs to happen. It makes explicit
                  which services HR provides, where that work should sit, how it
                  should flow, what should be standard, where local judgement is
                  appropriate, and how the whole model is supported by systems,
                  knowledge, data, and governance.
                </p>
                <p>
                  That is why operating-model problems often show up as service
                  problems rather than organisation-chart problems. Managers do
                  not usually complain that the HR architecture is unclear. They
                  experience slow answers, different answers, repeated requests
                  for the same information, unclear ownership, or processes that
                  depend too heavily on knowing the right person.
                </p>
              </div>
            </div>

            <div className="mt-14">
              <p className="brand-section-kicker">Core components</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                Eight elements need to work together.
              </h2>
              <p className="brand-body mt-5">
                Different organisations will describe their model in different
                ways, but a practical HR operating model normally needs clear
                answers across the following areas.
              </p>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {modelComponents.map((component) => (
                  <section
                    key={component.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <h3 className="text-lg font-semibold text-slate-950">
                      {component.title}
                    </h3>
                    <p className="mt-3 text-base leading-7 text-slate-700">
                      {component.text}
                    </p>
                  </section>
                ))}
              </div>
            </div>

            <div className="mt-14">
              <p className="brand-section-kicker">Design choice</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                Centralised versus local HR is rarely a binary decision.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  One of the most common operating-model debates is whether HR
                  should be centralised or remain close to local businesses and
                  countries. In practice, strong models usually make a more
                  precise set of choices.
                </p>
                <p>
                  Some activities benefit from common standards, shared
                  technology, consolidated expertise, and a single service
                  route. Others require local knowledge, proximity to leaders,
                  employment-law context, language capability, or sensitivity to
                  the way a particular business operates.
                </p>
                <p>
                  The useful question is therefore not simply, "Should HR be
                  centralised?" It is, "Which work should be common, which work
                  should be local, and how should the handoff between the two
                  operate?"
                </p>
                <p>
                  That distinction matters especially in international or
                  acquisition-led organisations. A model that standardises
                  everything can become disconnected from local reality. A model
                  that leaves everything local can make consistency, controls,
                  data, technology, and service quality much harder to manage.
                </p>
              </div>
            </div>

            <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-7 lg:p-8">
              <p className="brand-section-kicker">Warning signs</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                How do you know the HR operating model is no longer scaling?
              </h2>
              <p className="brand-body mt-4">
                The problem is rarely announced as an operating-model issue.
                More often, the organisation starts to see a pattern of
                operational symptoms.
              </p>
              <ul className="mt-6 list-disc space-y-3 pl-6 text-base leading-8 text-slate-700">
                {strainSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
              <p className="brand-body mt-6">
                Any one of these can be a local process issue. When several show
                up together, the better question is whether the underlying
                operating model still fits the scale and complexity of the
                organisation.
              </p>
              <p className="brand-body mt-4">
                I explore that pattern in more detail in{" ""}
                <Link
                  href="/insights/why-hr-operations-break-as-companies-grow"
                  className="brand-link font-medium"
                >
                  Why HR Operations Break as Companies Grow
                </Link>
                .
              </p>
            </div>

            <div className="mt-14">
              <p className="brand-section-kicker">Technology</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                Decide how HR should operate before asking technology to fix it.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  Technology is a critical part of a modern HR operating model,
                  but it should enable the model rather than define it by
                  accident.
                </p>
                <p>
                  If ownership is unclear, service routes overlap, local
                  exceptions have not been resolved, and processes are not
                  designed end to end, a new platform can simply digitise those
                  problems. The organisation may gain a new interface while the
                  underlying ambiguity remains.
                </p>
                <p>
                  The more useful sequence is to define the service and process
                  intent first. Decide what should happen, who should own it,
                  what information is needed, where decisions sit, and which
                  exceptions are legitimate. Technology can then automate,
                  route, control, measure, and simplify a model that is already
                  clear enough to support.
                </p>
              </div>
            </div>

            <div className="mt-14">
              <p className="brand-section-kicker">Assessment</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                Start with how the current model actually works, not how it is
                supposed to work.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  Operating-model reviews can become abstract very quickly. A
                  practical assessment should begin with the day-to-day
                  experience of the people using and delivering HR services.
                </p>
                <p>
                  That means looking beyond policy documents and organisation
                  charts to the real flow of work: how requests arrive, how
                  managers make decisions, where employees get stuck, where HR
                  intervenes, which handoffs fail, what gets reworked, and which
                  exceptions consume disproportionate time.
                </p>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-7">
                <h3 className="text-xl font-semibold text-slate-950">
                  Six useful questions to ask
                </h3>
                <ol className="mt-5 list-decimal space-y-3 pl-6 text-base leading-8 text-slate-700">
                  {assessmentQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-14">
              <p className="brand-section-kicker">Redesign</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                A target operating model should solve specific operational
                problems.
              </h2>
              <div className="brand-body mt-5 space-y-5">
                <p>
                  A target model is useful when it translates business needs
                  into clear operating choices. It should explain what will be
                  different, why those changes matter, and how the new model will
                  work in practice.
                </p>
                <p>
                  The strongest redesigns are usually selective rather than
                  theoretical. They identify the few areas where the existing
                  model creates the greatest inconsistency, cost, delay, risk, or
                  dependency on individual knowledge, then make the operating
                  decisions needed to address them.
                </p>
                <p>
                  Depending on the organisation, that might mean a clearer
                  service entry point, stronger process ownership, a better
                  division of work between central and local HR, more effective
                  case management, cleaner data handoffs, stronger manager
                  self-service, or a different technology workflow.
                </p>
              </div>
            </div>

            <div className="mt-14">
              <p className="brand-section-kicker">Common questions</p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                HR operating model FAQs
              </h2>

              <div className="mt-7 space-y-7">
                <section>
                  <h3 className="text-xl font-semibold text-slate-950">
                    What is the difference between an HR operating model and an
                    HR organisation structure?
                  </h3>
                  <p className="brand-body mt-3">
                    The organisation structure shows how HR roles and teams are
                    arranged. The operating model explains how the whole
                    function delivers work, including process, ownership,
                    service channels, technology, knowledge, data, capacity, and
                    governance.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-950">
                    When should an organisation review its HR operating model?
                  </h3>
                  <p className="brand-body mt-3">
                    Typical triggers include rapid growth, international
                    expansion, acquisitions, repeated service inconsistency, HR
                    technology change, creation of shared services, or a pattern
                    of manual work and unclear ownership that is becoming harder
                    to sustain.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-950">
                    Does every company need HR shared services?
                  </h3>
                  <p className="brand-body mt-3">
                    No. Shared services are one possible delivery choice, not a
                    goal in themselves. The right model depends on scale,
                    geography, demand, capability, technology, regulatory
                    context, and the type of employee and manager support the
                    business needs.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-950">
                    Should HR technology be selected before the operating model
                    is designed?
                  </h3>
                  <p className="brand-body mt-3">
                    Usually not. Technology choices are stronger when the
                    organisation is already clear about the processes, service
                    routes, ownership, data, controls, and user experience the
                    technology needs to support.
                  </p>
                </section>
              </div>
            </div>

            <div className="mt-14 rounded-2xl bg-[#0D1F3C] p-8 text-white lg:p-10">
              <p className="brand-kicker">Where to start</p>
              <h2 className="brand-heading-lg mt-3 text-white">
                Understand the current model before deciding what to redesign.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#C7D8EA]">
                The HR Operations Health Check is a useful first read when you
                want to understand where operational strain may be building. For
                organisations with an established HR model, the Diagnostic
                Assessment goes deeper across HR, managers, and leadership to
                show how consistently the model is working in practice.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/diagnostic" className="brand-button-primary">
                  Take the Health Check
                </Link>
                <Link
                  href="/diagnostic-assessment"
                  className="brand-button-secondary-dark"
                >
                  View Diagnostic Assessment
                </Link>
                <Link
                  href="/services/fractional-hr-advisory"
                  className="brand-button-secondary-dark"
                >
                  Explore Fractional Advisory
                </Link>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-8">
              <p className="text-sm leading-6 text-slate-600">
                Van Esch Advisory works with growing and complex organisations
                on HR operations, service delivery, operating-model improvement,
                and HR technology transformation. Learn more about the experience
                behind the work on the{" "}
                <Link href="/about" className="brand-link font-medium">
                  About page
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
