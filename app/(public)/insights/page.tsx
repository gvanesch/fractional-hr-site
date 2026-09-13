import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HR Operations Insights",
  description:
    "Practical insights on HR operations, service delivery, operating models, process design, and how HR infrastructure evolves as organisations grow.",
};

const articles = [
  {
    title: "What Is an HR Operating Model? A Practical Guide",
    description:
      "What an HR operating model actually covers, the core design choices, how to recognise when the model is no longer scaling, and where to start improving it.",
    href: "/insights/what-is-an-hr-operating-model",
  },
  {
    title: "Why HR Operations Break as Companies Grow",
    description:
      "Why informal HR ways of working become harder to sustain as organisations scale, and the operational signals that show where the model needs strengthening.",
    href: "/insights/why-hr-operations-break-as-companies-grow",
  },
];

export default function InsightsPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Insights</p>
            <h1 className="brand-heading-xl mt-3">HR Operations Insights</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Practical perspectives on HR operations, service delivery,
              operating models, technology, and the point where informal ways
              of working need stronger structure.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="grid gap-6">
            {articles.map((article) => (
              <article
                key={article.href}
                className="brand-surface-card p-8 lg:p-10"
              >
                <h2 className="brand-heading-md text-slate-950">
                  {article.title}
                </h2>
                <p className="brand-body mt-4 max-w-3xl">
                  {article.description}
                </p>
                <Link
                  href={article.href}
                  className="brand-link mt-5 inline-flex font-medium"
                >
                  Read the article
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
