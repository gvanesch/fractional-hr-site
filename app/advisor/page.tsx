import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const ADVISOR_CARDS = [
  {
    title: "Create project",
    description: "Set up a new diagnostic project and invite participants.",
    href: "/advisor/create-project",
  },
  {
    title: "View projects",
    description: "Monitor completion, manage participants, and access reports.",
    href: "/advisor/projects",
  },
  {
    title: "Health checks",
    description:
      "Review inbound health check submissions and early advisory signals.",
    href: "/advisor/submissions",
  },
  {
    title: "Prospect CRM",
    description:
      "Manage prospects, track outreach, and keep advisory pipeline activity in one place.",
    href: "/advisor/prospects",
  },
];

export default async function AdvisorHomePage() {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Advisor dashboard
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Manage diagnostic projects, review health check signals, track
              prospects, and move from structured insight to advisory action.
            </p>

          </div>
        </div>
      </section>

      <div className="brand-container py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADVISOR_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="brand-surface-card p-6 transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}