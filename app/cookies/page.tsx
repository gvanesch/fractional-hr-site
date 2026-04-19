import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Van Esch Advisory Ltd",
  description:
    "Cookie Policy for vanesch.uk, explaining how cookies and similar technologies are used on the website.",
};

export default function CookiesPage() {
  return (
    <main>
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Cookie Policy</p>
            <h1 className="brand-heading-xl mt-3">Cookie Policy</h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This Cookie Policy explains how cookies and similar technologies
              are used on https://vanesch.uk.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">What this page covers</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Cookies and similar technologies
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Cookies are small text files stored on your device when you
                  visit a website. Similar technologies can also be used to
                  store information on, or access information from, your device.
                </p>
                <p>
                  On this website, that may include browser storage such as
                  local storage, as well as technologies used by infrastructure,
                  security, and service providers that support the operation of
                  the website.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Current use on this website</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                How storage and access technologies are currently used
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website currently uses storage and access technologies
                  where they are needed for basic functionality, security,
                  resilience, or the operation of user-requested features.
                </p>
                <p>
                  In particular, the public HR Health Check may store limited
                  information locally in your browser so that progress can be
                  retained during completion of the assessment and so that the
                  results flow can continue more smoothly after submission.
                </p>
                <p>
                  The website may also rely on infrastructure and security
                  services provided by Cloudflare to support delivery,
                  performance, and protection against malicious traffic.
                </p>
                <p>
                  As at the date of this policy, the website does not use
                  non-essential advertising, marketing, or cross-site tracking
                  cookies.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Health Check browser storage</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Local storage used by the public diagnostic
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  When you use the public HR Health Check, information you enter
                  may be stored locally in your browser to help preserve your
                  progress and support the assessment journey.
                </p>
                <p>
                  This may include draft response information and related
                  identifiers needed to continue the flow within the same
                  browser.
                </p>
                <p>
                  This browser-stored information can usually be removed by
                  resetting the assessment or clearing browser storage through
                  your browser settings.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Analytics</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Measurement and performance monitoring
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website does not currently use analytics tools that rely
                  on cookies or similar client-side tracking technologies.
                </p>
                <p>
                  If that changes, this policy will be updated to describe the
                  relevant tools, purposes, and any choices made available to
                  users.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Third-party services</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                External providers and their technologies
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website may use third-party infrastructure or service
                  providers to support secure delivery, communications, or other
                  operational functions.
                </p>
                <p>
                  Where those providers use cookies or similar technologies in
                  connection with their own services, those technologies are
                  governed by the relevant third party’s own terms, privacy
                  notice, and cookie policy.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Your choices</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Managing cookies and browser storage
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Most browsers allow you to manage or remove cookies and other
                  browser-stored data through their settings. You can usually
                  block cookies, delete existing cookies, and clear local
                  storage or similar data stored in your browser.
                </p>
                <p>
                  Please note that blocking or removing strictly necessary
                  technologies may affect how some parts of the website,
                  including the HR Health Check flow, operate in practice.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Future updates</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                If site tools change
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  If the technologies used on this website change materially,
                  this page will be updated to reflect those changes in a more
                  specific way, including where relevant the purpose of the
                  technology, whether a third party is involved, and what user
                  choices are available.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">More information</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">
                Related pages
              </h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  For more information about how personal data is handled,
                  please see the{" "}
                  <Link href="/privacy" className="brand-link font-medium">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}