import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Greg van Esch",
  description:
    "Privacy Policy for vanesch.uk, explaining how personal information is collected, used, stored, and protected.",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="brand-hero">
        <div className="brand-hero-content mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-4xl">
            <p className="brand-kicker">Privacy Policy</p>
            <h1 className="brand-heading-xl mt-3">
              Privacy Policy
            </h1>
            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This Privacy Policy explains how personal information is collected, used,
              and protected when you visit vanesch.uk or contact me through the website.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="space-y-12">
            <section>
              <p className="brand-section-kicker">Who I am</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Data controller</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website is operated by Greg van Esch.
                </p>
                <p>
                  For the purposes of applicable data protection law, I am the controller of
                  personal data collected through this website unless otherwise stated.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Information collected</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">What information may be collected</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on how you use the website, I may collect:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Your name</li>
                  <li>Your email address</li>
                  <li>Your organisation name</li>
                  <li>Details you include in a contact form enquiry</li>
                  <li>Basic technical information needed for the website to function properly</li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">How information is collected</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Sources of personal data</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>Information may be collected when you:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Submit an enquiry through the contact form</li>
                  <li>Communicate directly in relation to potential services</li>
                  <li>Use the website in ways that generate technical or server-side information</li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Why information is used</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Purposes of processing</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>Personal information may be used to:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Respond to enquiries</li>
                  <li>Communicate about potential advisory services</li>
                  <li>Manage and administer the website</li>
                  <li>Maintain website security and performance</li>
                  <li>Comply with legal or regulatory obligations where applicable</li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Lawful bases</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Why this processing is lawful</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on the context, personal data is processed on one or more of the following bases:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>To take steps at your request before entering into a business relationship</li>
                  <li>For legitimate interests in running and improving the website and responding to enquiries</li>
                  <li>To comply with legal obligations where relevant</li>
                  <li>With consent, where consent is specifically required</li>
                </ul>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Sharing information</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Who information may be shared with</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Personal data may be shared with service providers who support the operation of the website
                  or enquiry handling process, where necessary and subject to appropriate safeguards.
                </p>
                <p>
                  Information is not sold to third parties.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Retention</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">How long information is kept</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Personal data is kept only for as long as reasonably necessary for the relevant purpose,
                  including responding to enquiries, maintaining business records, and meeting legal or
                  regulatory obligations where applicable.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Your rights</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Data protection rights</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on the applicable law and circumstances, you may have rights to request access,
                  correction, erasure, restriction, objection, or portability in relation to your personal data.
                </p>
                <p>
                  You may also have the right to complain to a relevant supervisory authority.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Contact</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Questions about privacy</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  If you have any questions about this Privacy Policy or how your data is handled,
                  please use the website contact form.
                </p>
                <p>
                  You can also visit the <Link href="/contact" className="brand-link font-medium">Contact</Link> page.
                </p>
              </div>
            </section>

            <section>
              <p className="brand-section-kicker">Updates</p>
              <h2 className="brand-heading-md mt-3 text-slate-950">Changes to this policy</h2>
              <div className="brand-body mt-4 space-y-4">
                <p>
                  This policy may be updated from time to time to reflect changes to the website,
                  services, or legal requirements.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}