import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Greg van Esch",
  description:
    "Cookie Policy for vanesch.uk, explaining how cookies and similar technologies are used on the website.",
};

export default function CookiesPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Cookie Policy</p>
            <h1 className="brand-heading-xl mt-3">
              Cookie Policy
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This Cookie Policy explains how cookies and similar technologies may be used on vanesch.uk.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">What cookies are</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Cookies and similar technologies</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Cookies are small text files stored on your device when you visit a website.
                  Similar technologies can also be used to store or access information on your device.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">How this site uses them</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Current use on this website</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website is intended to use only cookies or similar technologies that are
                  strictly necessary for the operation, security, and basic functionality of the site,
                  unless and until additional tools are introduced.
                </p>
                <p>
                  If analytics, advertising, tracking, or other non-essential technologies are added
                  in the future, this policy and any required consent mechanisms will be updated accordingly.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Types of cookies</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Categories</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>The following categories may be relevant on websites generally:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li><strong>Strictly necessary cookies</strong> — used to make a site function properly</li>
                  <li><strong>Analytics cookies</strong> — used to measure usage and performance</li>
                  <li><strong>Preference cookies</strong> — used to remember choices or settings</li>
                  <li><strong>Marketing cookies</strong> — used for advertising or cross-site tracking</li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Managing cookies</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Your choices</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Most browsers allow you to manage or remove cookies through their settings.
                  You can usually block cookies, delete existing cookies, or choose to be notified
                  when cookies are being placed.
                </p>
                <p>
                  Please note that blocking strictly necessary cookies may affect how the website works.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Future updates</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">If site tools change</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  If non-essential cookies or similar technologies are added in future, this page
                  will be updated to describe them more specifically, including their purpose and duration.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">More information</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Related pages</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  For more information about how personal data is handled, please see the{" "}
                  <Link href="/privacy" className="brand-link font-medium">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}