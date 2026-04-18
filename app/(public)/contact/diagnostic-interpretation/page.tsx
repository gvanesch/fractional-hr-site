import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fractional HR Advisory | Van Esch Advisory Ltd",
  description:
    "Fractional HR advisory support for organisations that need structure, direction, and operational improvement without a full-time hire.",
};

const coverageAreas = [
  "HR operating model and service delivery structure",
  "Onboarding, offboarding, and employee lifecycle design",
  "HR process clarity, ownership, and governance",
  "HR technology alignment and workflow design",
  "Knowledge management and self-service enablement",
  "Operational prioritisation and improvement roadmap",
];

const goodFit = [
  "Scaling organisations without senior HR leadership in place",
  "Businesses where HR is currently handled across founders, finance, or operations",
  "Organisations experiencing inconsistency in HR processes or delivery",
  "Post-acquisition or integration environments needing structure",
];

const notFit = [
  "Organisations primarily needing high-volume HR administration support",
  "Very early-stage businesses without meaningful HR complexity",
  "Fully mature HR functions with established senior leadership already in place",
];

const valuePoints = [
  {
    title: "Senior capability without a full-time cost base",
    text: "Access structured HR leadership and operational direction without committing to a full-time senior hire before the business is ready.",
  },
  {
    title: "A clearer operating model",
    text: "Bring more consistency to ownership, service delivery, onboarding, manager support, and the day-to-day mechanics of how HR actually works.",
  },
  {
    title: "Practical prioritisation",
    text: "Focus effort on the operational improvements most likely to strengthen clarity, reduce drag, and support scale.",
  },
];

const operatingSignals = [
  "HR responsibilities sit across founders, finance, or operations",
  "Managers handle similar people issues differently",
  "Processes exist, but not always in a way that feels reliable",
  "HR work is becoming more reactive as the business grows",
  "The business needs more structure, but not necessarily a full-time HR leader yet",
  "Leadership wants clearer priorities and stronger execution",
];

const heroHelpAreas = [
  "Scaling businesses that need more structure before problems become embedded",
  "Leadership teams that need senior HR direction without a full-time hire",
  "Organisations where HR is spread across founders, finance, or operations",
  "Businesses that need clearer ownership, better process discipline, and more reliable execution",
];

type StandardCardProps = {
  kicker?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  tone?: "white" | "soft" | "dark";
  titleSize?: "md" | "lg";
};

function StandardCard({
  kicker,
  title,
  body,
  children,
  tone = "white",
  titleSize = "md",
}: StandardCardProps) {
  const toneClass =
    tone === "white"
      ? "border-slate-300 bg-white shadow-sm"
      : tone === "soft"
        ? "border-slate-300 bg-slate-50"
        : "border-white/10 bg-white/5";

  const kickerClass =
    tone === "dark"
      ? "text-[#8AAAC8]"
      : "text-[var(--brand-accent)]";

  const titleClass =
    tone === "dark" ? "text-white" : "text-slate-950";

  const bodyClass =
    tone === "dark" ? "text-slate-200" : "text-slate-700";

  const headingSizeClass =
    titleSize === "lg" ? "brand-heading-lg" : "brand-heading-md";

  return (
    <div className={`h-full rounded-[1.75rem] border p-8 ${toneClass}`}>
      <div className="flex h-full flex-col">
        {kicker ? (
          <p
            className={`text-xs font-semibold uppercase tracking-[0.18em] ${kickerClass}`}
          >
            {kicker}
          </p>
        ) : null}

        <div className="min-h-[112px] pt-3">
          <h2 className={`${headingSizeClass} ${titleClass}`}>{title}</h2>
        </div>

        {body ? (
          <p className={`flex-1 text-base leading-8 ${bodyClass}`}>{body}</p>
        ) : null}

        {children ? <div className="flex-1 pt-5">{children}</div> : null}
      </div>
    </div>
  );
}

function ListBox({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-700"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function CompactValueCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="h-full rounded-[1.5rem] border border-slate-300 bg-white p-6 shadow-sm">
      <div className="flex h-full flex-col">
        <div className="min-h-[96px]">
          <h3 className="brand-heading-md text-slate-950">{title}</h3>
        </div>
        <p className="flex-1 text-base leading-8 text-slate-700">{text}</p>
      </div>
    </div>
  );
}

function ScopeCard({ text }: { text: string }) {
  return (
    <div className="h-full rounded-[1.5rem] border border-slate-300 bg-white p-6 shadow-sm">
      <div className="flex h-full items-start">
        <p className="text-base leading-8 text-slate-700">{text}</p>
      </div>
    </div>
  );
}

export default function FractionalHRPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="brand-kicker">Fractional HR Advisory</p>

                <h1 className="brand-heading-xl mt-3">
                  Fractional HR advisory support, when full-time is not the right fit.
                </h1>

                <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
                  Senior HR operations and service delivery support on a part-time
                  basis, providing structure, direction, and execution without the
                  need for a full-time hire.
                </p>

                <p className="mt-4 max-w-3xl text-base leading-8 text-[#C7D8EA]">
                  This is designed for organisations that need more clarity and
                  stronger operational foundations, but do not yet need, or want,
                  a full-time senior HR leader.
                </p>
              </div>

              <div className="pt-8">
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://calendly.com/greg-vanesch/20min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                  >
                    Book a 20-minute discussion
                  </a>

                  <Link
                    href="/contact"
                    className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
                  >
                    Request a tailored discussion
                  </Link>
                </div>

                <p className="mt-4 max-w-3xl text-sm text-[#8AAAC8]">
                  Book now for a direct conversation, or request a tailored
                  discussion if you want your context reviewed in advance.
                </p>
              </div>
            </div>

            <div className="brand-card-dark h-full p-8 lg:p-9">
              <div className="flex h-full flex-col">
                <p className="brand-kicker">Where this usually helps</p>

                <div className="mt-5 grid flex-1 gap-4">
                  {heroHelpAreas.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 text-base leading-7 text-white"
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

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <StandardCard
              kicker="Context"
              title="When HR is too important to leave informal, but not yet a full-time role"
              tone="white"
              titleSize="lg"
            >
              <div className="space-y-4 text-base leading-8 text-slate-700">
                <p>
                  In many organisations, HR responsibilities sit across founders,
                  finance, or operations. Processes evolve organically, onboarding
                  varies by manager, and ownership is not always fully clear.
                </p>
                <p>
                  This often works for a period of time. As the organisation grows,
                  it can begin to create inconsistency, operational drag, and
                  increasing reliance on individual judgement.
                </p>
                <p>
                  Hiring a full-time senior HR leader may feel premature. Leaving
                  the model unchanged can make day-to-day execution harder than it
                  needs to be.
                </p>
              </div>
            </StandardCard>

            <StandardCard
              kicker="Typical signals"
              title="Signs this model may be worth considering"
              tone="white"
              titleSize="lg"
            >
              <ListBox items={operatingSignals} />
            </StandardCard>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <StandardCard
              kicker="What this is"
              title="Structured HR leadership, part-time"
              body="This is not administrative support or ad hoc consulting. It is structured, senior-level HR operations leadership delivered on a part-time basis."
              tone="soft"
              titleSize="lg"
            >
              <p className="text-base leading-8 text-slate-700">
                The focus is on bringing clarity to how HR operates, improving
                consistency across the employee lifecycle, and ensuring the
                organisation has a model that can support growth.
              </p>
            </StandardCard>

            <StandardCard
              kicker="How it works"
              title="A structured, part-time engagement"
              body="Engagements are typically structured on a part-time basis, often one to two days per week or an equivalent allocation."
              tone="soft"
              titleSize="lg"
            >
              <div className="space-y-4 text-base leading-8 text-slate-700">
                <p>
                  Work is prioritised around the areas that will have the most
                  operational impact, with a clear cadence, defined focus, and
                  ongoing alignment with leadership.
                </p>
                <p>
                  The aim is to move from reactive handling to a more deliberate
                  and scalable operating model.
                </p>
              </div>
            </StandardCard>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3 md:items-stretch">
            {valuePoints.map((item) => (
              <CompactValueCard
                key={item.title}
                title={item.title}
                text={item.text}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="rounded-[1.75rem] border border-slate-300 bg-slate-50 p-8 lg:p-10">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-accent)]">
                Scope
              </p>
              <h2 className="brand-heading-lg mt-3 text-slate-950">
                What this can cover
              </h2>
              <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700">
                The exact scope depends on the business, but the work usually
                focuses on the areas most likely to improve clarity, consistency,
                and operating confidence.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
              {coverageAreas.map((item) => (
                <ScopeCard key={item} text={item} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <StandardCard
              kicker="Good fit"
              title="Where this works well"
              tone="white"
              titleSize="lg"
            >
              <ListBox items={goodFit} />
            </StandardCard>

            <StandardCard
              kicker="Not the right fit"
              title="Where a different model is better"
              tone="white"
              titleSize="lg"
            >
              <ListBox items={notFit} />
            </StandardCard>
          </div>
        </div>
      </section>

      <section className="brand-dark-section py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="brand-card-dark max-w-4xl rounded-[2rem] p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>
                <h2 className="brand-heading-lg">
                  Decide whether this is the right level of support
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  You can book a short discussion now, or start a conversation.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="https://calendly.com/greg-vanesch/20min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-button-primary rounded-xl px-6 py-3 text-base font-medium"
                >
                  Book a 20-minute discussion
                </a>

                <Link
                  href="/contact"
                  className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
                >
                  Start a conversation
                </Link>
              </div>

              <p className="text-sm text-[#8AAAC8]">
                Book now for a direct conversation, or start a conversation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}