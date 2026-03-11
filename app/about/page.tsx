import SiteShell from "@/components/SiteShell";

const expertise = [
  "Global People Operations leadership across regulated and complex environments",
  "ServiceNow HRSD implementation, optimisation, and workflow orchestration",
  "HR shared services design and operational governance",
  "M&A integration, TUPE, harmonisation, and workforce transition support",
  "Compliance, controls, audit readiness, and operational risk reduction",
  "Automation and AI-ready HR operating model design",
];

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">About</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              HR operations experience built in the real world.
            </h1>
            <div className="mt-6 space-y-5 text-lg leading-8 text-slate-700">
              <p>
                I am an HR Operations and Transformation leader with more than seventeen years of
                experience across global HR operations, HR technology, compliance, and workforce change.
              </p>
              <p>
                Over the course of my career I have led global People Operations supporting more than
                4,000 employees, contractors, and consultants across 27 countries, while building and
                scaling shared services environments, improving service delivery, and strengthening
                operational controls.
              </p>
              <p>
                My background includes HRIS management, ServiceNow HRSD implementation, M&A integration,
                TUPE and harmonisation work, benefits and vendor optimisation, audit and compliance
                leadership, and the design of scalable employee lifecycle processes.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Experience Highlights
            </p>
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
    </SiteShell>
  );
}