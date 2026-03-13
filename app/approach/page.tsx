import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Approach | Greg van Esch",
  description:
    "A practical, boutique approach to HR operations advisory for growing companies and complex organisations, grounded in discovery, operational reality, and sustainable implementation.",
};

const discoveryPoints = [
  "Leadership conversations to understand business priorities and operational realities",
  "Review of current HR processes, documentation, and working practices",
  "Identification of friction points, bottlenecks, and inconsistencies",
  "Clarifying what the organisation needs now versus what it may need later",
];

const toolsAndMethods = [
  "Current-state process mapping",
  "Start / Stop / Continue reviews",
  "Future-state workshops",
  "Leadership alignment discussions",
  "Priority and dependency mapping",
];

const principles = [
  {
    title: "Business-first, not template-first",
    text: "The starting point is understanding how the organisation actually operates, not forcing it into a standard model.",
  },
  {
    title: "Practical over theoretical",
    text: "The objective is to create operational improvements that teams can realistically use and sustain day-to-day.",
  },
  {
    title: "Fit for the stage of the business",
    text: "A 70-person scaling company does not need the same HR structures as a global enterprise. The solution should reflect the organisation’s maturity, pace, and constraints.",
  },
  {
    title: "Stable and robust change",
    text: "The aim is not short-term activity. It is to put in place HR operations that remain effective as the business grows and changes.",
  },
];

export default function ApproachPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Approach</p>
            <h1 className="brand-heading-xl mt-3">
              A boutique, practical approach to HR operations advisory.
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              My approach starts with understanding how a business actually works — its people,
              priorities, constraints, ambitions, and operational realities. From there, I help
              design HR structures, processes, and systems that fit the business rather than
              forcing the business into a predefined template.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="brand-section-kicker">Why this matters</p>
            <h2 className="brand-heading-lg mt-3 text-slate-950">
              The right answer depends on the business, not just the framework.
            </h2>
            <div className="brand-body brand-body-lg mt-4 space-y-4">
              <p>
                Many consulting firms begin with standard templates and predefined methodologies.
                Those approaches can be useful in some contexts, but they often miss the nuance of how
                a business really operates. Growing companies and mid-market organisations in
                particular usually need something more tailored: support that takes account of their
                real-world limitations, pace of growth, decision-making style, and available resource.
              </p>
              <p>
                The goal is not to produce documents for the sake of it. The goal is to create
                practical change that is stable, robust, and genuinely usable day-to-day.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="brand-section-kicker">How engagements typically begin</p>
            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Start with discovery and operational understanding.
            </h2>
            <p className="brand-subheading mt-4 text-slate-700">
              Before recommending changes, I take time to understand the organisation properly.
              That usually means speaking with leadership, reviewing the current operating
              environment, understanding where friction exists, and identifying what the business
              genuinely needs now.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {discoveryPoints.map((point) => (
              <div
                key={point}
                className="brand-surface-soft rounded-2xl p-5 text-lg leading-8 text-slate-700"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="brand-section-kicker">Typical methods</p>
            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Structured thinking, applied practically.
            </h2>
            <p className="brand-subheading mt-4 text-slate-700">
              Depending on the situation, I may use a combination of process mapping, prioritisation
              exercises, and future-state design sessions to help organisations understand where they
              are today and what should come next.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {toolsAndMethods.map((tool) => (
              <div
                key={tool}
                className="brand-surface rounded-2xl p-5 text-lg leading-8 text-slate-700"
              >
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="brand-section-kicker">Core principles</p>
            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Four principles that shape the work.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="brand-surface-soft rounded-[1.75rem] p-8"
              >
                <h3 className="brand-heading-md text-slate-950">{principle.title}</h3>
                <p className="brand-body mt-4">{principle.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <p className="brand-section-kicker">What clients can expect</p>
            <h2 className="brand-heading-lg mt-3 text-slate-950">
              Clear thinking, practical recommendations, and work that fits the business.
            </h2>
            <p className="brand-subheading mt-4 text-slate-700">
              Whether the challenge is building stronger HR foundations in a growing company or
              stabilising a more complex enterprise operating environment, the emphasis is the same:
              understand the business properly, focus on what matters most, and deliver changes that
              can be implemented and sustained.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-dark-section py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="brand-card-dark max-w-4xl rounded-[2rem] p-10 shadow-2xl shadow-black/20">
            <p className="brand-kicker">Next step</p>
            <h2 className="brand-heading-lg mt-3">
              Want to discuss how this could apply to your organisation?
            </h2>
            <p className="brand-subheading brand-body-on-dark mt-4 max-w-3xl">
              If you are exploring how to improve HR operations, strengthen service delivery, or
              build more scalable foundations, I would be happy to talk.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
              >
                Contact Me
              </Link>
              <Link
                href="/services"
                className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}