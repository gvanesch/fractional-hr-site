import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fractional HR Advisory",
  description:
    "Fractional HR advisory support for organisations that need stronger structure, direction, and operational clarity without a full-time hire.",
};

const fractionalContactHref =
  "/contact?topic=Fractional%20HR%20Advisory";

const recognitionItems = [
  {
    number: "01",
    title: "HR responsibility is spread across the business",
    text: "Responsibility sits across founders, finance, or operations. What works early on becomes harder to manage consistently as the organisation grows.",
  },
  {
    number: "02",
    title: "An existing model becomes harder to run cleanly",
    text: "A structure is in place, but increased scale, pace, or organisational complexity makes consistency harder to maintain across day-to-day HR delivery.",
  },
  {
    number: "03",
    title: "Ownership and decision paths become less clear",
    text: "As the organisation evolves, managers, HR, and leadership do not always operate with the same level of clarity on who owns what, when to escalate, or how decisions should be handled.",
  },
  {
    number: "04",
    title: "HR becomes increasingly reactive",
    text: "Time shifts towards handling issues and workarounds, rather than improving how HR operates overall.",
  },
];

export default function FractionalHRPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <div className="brand-stack-md pb-14 md:pb-16">
              <h1 className="brand-heading-xl max-w-5xl">
                Fractional HR advisory focused on how HR actually runs.
              </h1>

              <p className="brand-subheading brand-body-on-dark max-w-4xl">
                Senior HR operations and service delivery input for organisations
                that need more structure, clearer ownership, and stronger
                day-to-day execution, without committing to a full-time hire.
              </p>

              <p className="max-w-4xl text-base leading-8 text-[#C7D8EA]">
                Most relevant where HR responsibility is still spread across the
                business, or where an existing model is becoming harder to run
                cleanly as complexity increases.
              </p>
            </div>

            <div className="brand-actions">
              <a
                href="https://calendly.com/greg-vanesch/20min"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Book a 20-minute discussion
              </a>

              <Link
                href={fractionalContactHref}
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Request a tailored discussion
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RECOGNITION */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">
              When this model typically becomes relevant
            </p>

            <h2 className="brand-heading-lg text-slate-950">
              You usually recognise the pattern before you formalise the role.
            </h2>

            <p className="brand-body-lg">
              Fractional support is most relevant when HR has become too important
              to leave informal, but the organisation is not yet ready for a
              full-time senior hire.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-ruled-list">
              {recognitionItems.map((item) => (
                <div key={item.number} className="brand-ruled-item">
                  <p className="brand-ruled-item-num">{item.number}</p>

                  <div>
                    <h3 className="brand-ruled-item-title">{item.title}</h3>
                    <p className="brand-ruled-item-body">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REMAINING SECTIONS UNCHANGED FOR NOW */}
    </>
  );
}