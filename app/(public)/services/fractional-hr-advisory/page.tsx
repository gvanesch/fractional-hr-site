import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fractional HR Advisory",
  description:
    "Fractional HR advisory support for organisations that need stronger structure, direction, and operational clarity without a full-time hire.",
};

const fractionalContactHref =
  "/contact?topic=Fractional%20HR%20Advisory";

const coverageAreas = [
  "HR operating model and service delivery structure",
  "Onboarding, offboarding, and employee lifecycle design",
  "HR process clarity, ownership, and governance",
  "HR technology alignment and workflow design",
  "Knowledge management and self-service enablement",
  "Operational prioritisation and improvement roadmap",
];

const goodFit = [
  "Businesses where HR is currently handled across founders, finance, or operations",
  "Scaling organisations without senior HR leadership in place",
  "Organisations experiencing inconsistency in HR processes or delivery",
  "Post-acquisition or integration environments needing structure, integration and harmonisation",
];

const notFit = [
  "Organisations primarily needing high-volume HR administration support",
  "Very early-stage businesses without meaningful HR complexity",
  "Fully mature HR functions with established senior leadership already in place",
  "Organisations looking for purely strategic input without involvement in execution",
];

const valuePoints = [
  {
    title: "Senior capability with measured cost",
    text: "Bring in experienced HR operations and service delivery leadership without committing to a full-time senior hire before the business is ready.",
  },
  {
    title: "A clearer operating model",
    text: "Create more consistency across ownership, service delivery, onboarding, manager support, and the day-to-day mechanics of how HR runs.",
  },
  {
    title: "Focused operational progress",
    text: "Concentrate effort on the improvements most likely to strengthen clarity, consistency, and scalability.",
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
  "Scaling businesses that need more structure before issues become embedded",
  "Leadership teams that need senior HR direction without a full-time hire",
  "Organisations where HR is spread across founders, finance, or operations",
  "Businesses that need clearer ownership, better process discipline, and more reliable execution",
];

type CardTone = "surface" | "soft";

type SplitCardProps = {
  kicker: string;
  title: string;
  children: React.ReactNode;
  tone?: CardTone;
  titleMinHeightClass?: string;
};

function SplitCard({
  kicker,
  title,
  children,
  tone = "surface",
  titleMinHeightClass = "min-h-[6.5rem] lg:min-h-[6rem]",
}: SplitCardProps) {
  const toneClass =
    tone === "soft" ? "brand-surface-soft" : "brand-surface-card";

  return (
    <div className={`${toneClass} h-full p-8 lg:p-10`}>
      <div className="flex h-full flex-col">
        <p className="brand-section-kicker">{kicker}</p>

        <div className={`pt-3 ${titleMinHeightClass}`}>
          <h2 className="brand-heading-lg text-slate-950">{title}</h2>
        </div>

        <div className="mt-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

function ListStack({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="brand-surface rounded-xl px-4 py-3">
          <p className="text-base leading-7 text-slate-700">{item}</p>
        </div>
      ))}
    </div>
  );
}

function ValueCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="brand-surface-card h-full p-6 lg:p-7">
      <div className="flex h-full flex-col">
        <h3 className="brand-heading-md text-slate-950">{title}</h3>
        <p className="mt-4 flex-1 text-base leading-8 text-slate-700">{text}</p>
      </div>
    </div>
  );
}

function ScopeCard({ text }: { text: string }) {
  return (
    <div className="brand-surface h-full p-5">
      <p className="text-base leading-8 text-slate-700">{text}</p>
    </div>
  );
}

export default function FractionalHRPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="flex h-full flex-col justify-between">
              <div className="brand-stack-md">
                <div className="brand-stack-sm">
                  <p className="brand-kicker">Fractional HR Advisory</p>

                  <h1 className="brand-heading-xl">
                    Fractional HR advisory focused on how HR actually runs.
                  </h1>
                </div>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Senior HR operations and service delivery input for organisations
                  that need more structure, clearer direction, and stronger
                  day-to-day execution.
                </p>

                <p className="max-w-3xl text-base leading-8 text-[#C7D8EA]">
                  Typically used where HR is spread across founders, finance, or
                  operations, and the business needs clearer ownership, more
                  consistency, and stronger execution.
                </p>
              </div>

              <div className="brand-stack-sm pt-8">
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
                    href={fractionalContactHref}
                    className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
                  >
                    Request a tailored discussion
                  </Link>
                </div>

                <p className="max-w-3xl text-sm text-[#8AAAC8]">
                  Book now for a direct conversation, or request a tailored
                  discussion if you want your context reviewed in advance.
                </p>
              </div>
            </div>

            <div className="brand-card-dark h-full p-8 lg:p-9">
              <div className="flex h-full flex-col">
                <div className="brand-stack-sm">
                  <p className="brand-kicker">Where this usually helps</p>
                  <p className="text-sm leading-7 text-[#C7D8EA]">
                    Most relevant where HR is already under pressure and the
                    business needs more structure, clearer ownership, and more
                    consistent execution.
                  </p>
                </div>

                <div className="mt-6 grid gap-4">
                  {heroHelpAreas.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <p className="text-base leading-7 text-white">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <SplitCard
              kicker="Context"
              title="When HR is too important to leave informal, but not yet a full-time role"
            >
              <div className="brand-prose">
                <p>
                  In many organisations, HR responsibilities sit across founders,
                  finance, or operations. Processes evolve organically, onboarding
                  varies by manager, and ownership is not always fully clear.
                </p>

                <p>
                  That can work for a period. As the organisation grows, it often
                  becomes harder to maintain consistency, pace, and confidence in
                  day-to-day execution.
                </p>

                <p>
                  A full-time senior HR hire may feel premature. Leaving the model
                  unchanged can make growth harder than it needs to be.
                </p>
              </div>
            </SplitCard>

            <SplitCard
              kicker="Typical signals"
              title="Signs this model may be worth considering"
            >
              <ListStack items={operatingSignals} />
            </SplitCard>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <SplitCard
              kicker="What this is"
              title="Structured HR leadership, part-time"
              tone="soft"
            >
              <div className="brand-prose">
                <p>
                  This is not administrative support or ad hoc consulting. It is
                  senior HR operations and service delivery leadership delivered on
                  a part-time basis.
                </p>

                <p>
                  The focus is on bringing more clarity to how HR runs, improving
                  consistency across the employee lifecycle, and helping the
                  organisation build an operating model that supports growth.
                </p>
              </div>
            </SplitCard>

            <SplitCard
              kicker="How it works"
              title="A structured model with clear priorities"
              tone="soft"
            >
              <div className="brand-prose">
                <p>
                  Engagements are typically structured on a part-time basis, often
                  one to two days per week or an equivalent allocation.
                </p>

                <p>
                  Work is prioritised around the areas most likely to improve
                  operational clarity and execution, with a clear cadence and
                  ongoing alignment with leadership.
                </p>

                <p>
                  The aim is to move from reactive handling to a more deliberate
                  and scalable model.
                </p>
              </div>
            </SplitCard>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3 md:items-stretch">
            {valuePoints.map((item) => (
              <ValueCard key={item.title} title={item.title} text={item.text} />
            ))}
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="brand-surface-card p-8 lg:p-10">
            <div className="max-w-4xl brand-stack-sm">
              <p className="brand-section-kicker">Scope</p>

              <h2 className="brand-heading-lg text-slate-950">
                What this can cover
              </h2>

              <p className="brand-body max-w-4xl">
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

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <SplitCard
              kicker="Good fit"
              title="Where this works well"
              titleMinHeightClass="min-h-[7.5rem] lg:min-h-[7rem]"
            >
              <ListStack items={goodFit} />
            </SplitCard>

            <SplitCard
              kicker="A different model may suit better"
              title="Where another route is likely to be better"
              titleMinHeightClass="min-h-[7.5rem] lg:min-h-[7rem]"
            >
              <ListStack items={notFit} />
            </SplitCard>
          </div>
        </div>
      </section>

      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg">
                  Decide whether this is the right level of support
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Book a short discussion now, or request a tailored discussion if
                  you want your context reviewed in advance.
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
                  href={fractionalContactHref}
                  className="brand-button-secondary-dark rounded-xl px-6 py-3 text-base font-medium"
                >
                  Request a tailored discussion
                </Link>
              </div>

              <p className="text-sm text-[#8AAAC8]">
                Book now for a direct conversation, or request a tailored
                discussion if you want your context reviewed in advance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}