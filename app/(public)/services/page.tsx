import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "HR operations and transformation support for growing companies, complex organisations, and businesses that need focused senior HR advisory.",
};

const serviceRoutes = [
  {
    number: "01",
    title: "Growing Companies & Mid-Market",
    text: "For organisations that need stronger HR foundations, clearer operating rhythms, and more scalable processes before complexity starts to slow the business down.",
    href: "/services/growing-companies",
    cta: "Explore growing companies",
  },
  {
    number: "02",
    title: "Enterprise & Complex Organisations",
    text: "For organisations navigating shared services, HR technology programmes, regulatory complexity, and transformation across multiple markets or entities.",
    href: "/services/enterprise",
    cta: "Explore enterprise support",
  },
  {
    number: "03",
    title: "Fractional HR Advisory",
    text: "For organisations that need senior HR operations input without a full-time hire, whether during growth, transition, integration, or a period of operational strain.",
    href: "/services/fractional-hr-advisory",
    cta: "Explore fractional advisory",
  },
];

const pathwayItems = [
  {
    title: "Initial signal",
    text: "A quick way to identify where operational strain may be building across HR, managers, and leadership.",
    href: "/diagnostic",
    cta: "Take the Health Check",
  },
  {
    title: "Deeper diagnosis",
    text: "A structured, cross-role diagnostic of how HR actually operates, highlighting inconsistency, ownership gaps, and delivery risk.",
    href: "/diagnostic-assessment",
    cta: "Explore Diagnostic Assessment",
  },
  {
    title: "Focused action",
    text: "A defined engagement to act on diagnostic insight and improve the areas that will have the most operational impact first.",
    href: "/services/hr-foundations-sprint",
    cta: "Explore HR Foundations Sprint",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-container brand-hero-content brand-section">
          <div className="brand-section-intro brand-stack-md">
            <div className="brand-stack-sm">
              <p className="brand-kicker">Services</p>

              <h1 className="brand-heading-xl">
                HR advisory focused on how HR actually runs.
              </h1>
            </div>

            <p className="brand-subheading brand-body-on-dark max-w-4xl">
              Van Esch Advisory works across three operating contexts:
              organisations strengthening their foundations, more complex
              environments under operational strain, and businesses that need
              experienced HR operations support without a full-time senior hire.
            </p>

            <p className="max-w-4xl text-base leading-8 text-[#C7D8EA]">
              This page is here to help you choose the right route and understand
              how work usually starts.
            </p>

            <div className="brand-actions">
              <Link
                href="/diagnostic"
                className="brand-button-primary px-6 py-3 text-base font-medium"
              >
                Take the Health Check
              </Link>

              <Link
                href="/contact"
                className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
              >
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE ROUTES */}
      <section className="bg-white">
        <div className="brand-container brand-section-tight">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-section-kicker">Service routes</p>

            <h2 className="brand-heading-lg text-slate-950">
              Three ways to engage, depending on what the organisation needs.
            </h2>

            <p className="brand-body-lg">
              Each route is designed around a different operating context, but
              all three are grounded in the same principle: improve how HR runs,
              not just how it is described.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-ruled-list">
              {serviceRoutes.map((route) => (
                <div key={route.number} className="brand-ruled-item">
                  <p className="brand-ruled-item-num">{route.number}</p>

                  <div>
                    <h3 className="brand-ruled-item-title">{route.title}</h3>

                    <p className="brand-ruled-item-body">{route.text}</p>

                    <div className="mt-8">
                      <Link
                        href={route.href}
                        className="brand-button-secondary-light min-w-[15rem]"
                      >
                        {route.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PATHWAY */}
      <section className="brand-dark-section">
        <div className="brand-container brand-section">
          <div className="brand-section-intro-tight brand-stack-sm">
            <p className="brand-kicker">Pathway</p>

            <h2 className="max-w-3xl text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white lg:text-[3.45rem]">
              Work usually starts with a clearer view of where strain is building.
            </h2>

            <p className="max-w-3xl text-[1.05rem] leading-8 text-white/90">
              Most organisations do not begin with a full programme of work.
              They start by identifying where operational pressure is showing up,
              then move into more structured diagnosis and focused action.
            </p>
          </div>

          <div className="brand-section-body-xl">
            <div className="brand-rule-columns-dark">
              {pathwayItems.map((item) => (
                <div key={item.title} className="brand-rule-col-dark">
                  <h3 className="text-[1.25rem] font-semibold leading-[1.15] text-white">
                    {item.title}
                  </h3>

                  <p className="mt-4 max-w-md text-[1rem] leading-8 text-[#d6e2f0]">
                    {item.text}
                  </p>

                  <div className="mt-8">
                    <Link
                      href={item.href}
                      className="brand-button-secondary-dark"
                    >
                      {item.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="brand-dark-section-plain">
        <div className="brand-container brand-section-tight">
          <div className="brand-card-dark max-w-4xl p-10 shadow-2xl shadow-black/20">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-kicker">Next step</p>

                <h2 className="brand-heading-lg">
                  Get a clearer view of how your HR model is running.
                </h2>

                <p className="brand-subheading brand-body-on-dark max-w-3xl">
                  Start with the Health Check for an immediate view, or start a
                  conversation if you already know where the pressure is.
                </p>
              </div>

              <div className="brand-actions">
                <Link
                  href="/diagnostic"
                  className="brand-button-primary px-6 py-3 text-base font-medium"
                >
                  Take the Health Check
                </Link>

                <Link
                  href="/contact"
                  className="brand-button-secondary-dark px-6 py-3 text-base font-medium"
                >
                  Start a conversation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}