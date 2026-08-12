import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cyber Essentials Certified | Van Esch Advisory Ltd",
  description:
    "Cyber Essentials certification information for Van Esch Advisory Ltd.",
};

const certificateSearchUrl =
  "https://iasme.co.uk/cyber-essentials/ncsc-certificate-search/";

export default function CyberEssentialsPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Cyber Essentials</p>

            <h1 className="brand-heading-xl mt-3">
              Cyber Essentials certified
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Van Esch Advisory Ltd is Cyber Essentials certified across the
              whole organisation.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section pb-10 md:pb-14">
          <div className="mx-auto max-w-4xl space-y-12">
            <section>
              <p className="brand-section-kicker">Certification</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                A recognised cyber security baseline
              </h2>

              <div className="brand-body mt-4 max-w-3xl space-y-4">
                <p>
                  Cyber Essentials is the UK Government-backed cyber security
                  certification scheme designed to help organisations protect
                  themselves against common cyber threats.
                </p>

                <p>
                  Certification provides an additional level of assurance for
                  clients and organisations working with Van Esch Advisory,
                  including those using our client diagnostic services. It forms
                  part of our wider approach to responsible information handling
                  and security.
                </p>
              </div>
            </section>

            <section className="border-y border-slate-200 py-10 sm:py-12">
              <div>
                <h2 className="brand-heading-md text-slate-950">
                  Certification details
                </h2>

                  <dl className="mt-7 grid gap-x-12 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-slate-500">
                        Organisation
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-slate-900">
                        Van Esch Advisory Ltd
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-slate-500">
                        Scope
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-slate-900">
                        Whole organisation
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-slate-500">
                        Certification date
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-slate-900">
                        12 August 2026
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-slate-500">
                        Recertification due
                      </dt>
                      <dd className="mt-1 text-base font-semibold text-slate-900">
                        12 August 2027
                      </dd>
                    </div>

                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-slate-500">
                        Certificate number
                      </dt>
                      <dd className="mt-1 break-all text-base font-semibold text-slate-900">
                        acbc9192-47fc-4c84-bb6a-5eca8d3b46e5
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
                    <a
                      href={certificateSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-[#1E6FD9] transition hover:text-[#1559AF]"
                    >
                      Verify certification
                      <span aria-hidden="true" className="ml-2">
                        →
                      </span>
                    </a>

                    <a
                      href="/certifications/van-esch-advisory-cyber-essentials-certificate.pdf"
                      download
                      className="inline-flex items-center text-sm font-semibold text-[#1E6FD9] transition hover:text-[#1559AF]"
                    >
                      Download certificate (PDF)
                      <span aria-hidden="true" className="ml-2">
                        ↓
                      </span>
                    </a>
                  </div>
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-[132px_1fr] sm:items-center">
              <iframe
                src="https://registry.blockmarktech.com/certificates/acbc9192-47fc-4c84-bb6a-5eca8d3b46e5/widget/?tooltip_position=bottom_right&theme=transparent&hover=t"
                title="Van Esch Advisory Ltd Cyber Essentials certification"
                loading="lazy"
                style={{ border: "none", height: "132px", width: "132px" }}
              />

              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Cyber Essentials certification provides assurance against the
                technical controls defined by the scheme. Like any cyber security
                certification, it does not mean that an organisation is immune
                from cyber incidents.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
