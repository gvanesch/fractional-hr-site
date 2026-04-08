import AdvisorCreateProjectClient from "../../components/advisor/AdvisorCreateProjectClient";

export const metadata = {
  title: "Create Diagnostic Project | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdvisorCreateProjectPage() {
  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Create client diagnostic project
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Set up a new diagnostic project, add participants across respondent
              groups, and generate invite links for testing or live use.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container py-10 sm:py-12">
          <div className="mx-auto max-w-5xl">
            <AdvisorCreateProjectClient />
          </div>
        </div>
      </section>
    </main>
  );
}