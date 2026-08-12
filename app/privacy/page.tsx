import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Van Esch Advisory Ltd",
  description:
    "Privacy Policy for https://vanesch.uk, explaining how personal information is collected, used, stored, shared, and protected.",
};

const ICO_REGISTRATION_NUMBER = "ZC202153";

export default function PrivacyPage() {
  return (
    <main>
      {/* HERO */}
      <section className="brand-hero">
        <div className="brand-hero-content brand-container brand-section">
          <div className="max-w-4xl">
            <p className="brand-kicker">Privacy Policy</p>

            <h1 className="brand-heading-xl mt-3">Privacy Policy</h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This Privacy Policy explains how personal information is
              collected, used, stored, shared, and protected when you visit
              https://vanesch.uk, contact Van Esch Advisory Ltd, use the HR
              Operations Health Check, participate in an invited client
              diagnostic or Client Fact Pack, or engage with our services.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container brand-section">
          <div className="space-y-12">
            {/* DATA CONTROLLER AND PROCESSOR ROLES */}
            <section>
              <p className="brand-section-kicker">Who we are</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Data controller
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  This website is operated by Van Esch Advisory Ltd, a company
                  registered in England and Wales under company number
                  17101844.
                </p>

                <p>
                  Van Esch Advisory Ltd is the data controller for Personal
                  Data collected through this website, the HR Operations Health
                  Check, contact and enquiry forms, and other services where the
                  company determines the purposes and means of processing.
                </p>

                <p>
                  Where Van Esch Advisory Ltd processes Personal Data solely on
                  behalf of a consulting client under a separate agreement,
                  including an applicable Data Processing Agreement, it may act
                  as a data processor rather than as the data controller. In
                  those circumstances, the consulting client remains
                  responsible for determining the purposes and means of the
                  relevant processing.
                </p>

                <p>
                  Van Esch Advisory Ltd is registered with the{" "}
                  <a
                    href="https://ico.org.uk/about-the-ico/what-we-do/register-of-fee-payers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-link font-medium"
                  >
                    Information Commissioner&apos;s Office
                  </a>{" "}
                  as a data controller.
                </p>

                <p>
                  <strong>ICO registration number:</strong>{" "}
                  {ICO_REGISTRATION_NUMBER}
                </p>
              </div>
            </section>

            {/* COMPANY DETAILS */}
            <section>
              <p className="brand-section-kicker">Organisation details</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Company information
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <address className="not-italic">
                  <strong>Legal entity:</strong> Van Esch Advisory Ltd
                  <br />
                  <strong>Company number:</strong> 17101844
                  <br />
                  <strong>Registered office:</strong> 17 Heather Way, Harwell,
                  Didcot, Oxfordshire, OX11 6JZ, United Kingdom
                  <br />
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://vanesch.uk"
                    className="brand-link font-medium"
                  >
                    https://vanesch.uk
                  </a>
                </address>
              </div>
            </section>

            {/* INFORMATION COLLECTED */}
            <section>
              <p className="brand-section-kicker">Information collected</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                What information may be collected
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on how you interact with us, we may collect and
                  process the following categories of Personal Data:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>Your name</li>
                  <li>Your email address and other contact details</li>
                  <li>Your organisation name</li>
                  <li>Your role or job title</li>
                  <li>Your organisation&apos;s company size</li>
                  <li>Your organisation&apos;s industry</li>
                  <li>Your country or region</li>
                  <li>Information included in contact or enquiry forms</li>

                  <li>
                    Contextual information provided through the HR Operations
                    Health Check
                  </li>

                  <li>
                    Your responses to Health Check or client diagnostic
                    questions
                  </li>

                  <li>
                    Information provided through an invited Client Fact Pack
                  </li>

                  <li>
                    Results, scores, bands, summaries, recommendations, and
                    indicative assessments generated from your responses
                  </li>

                  <li>
                    Information provided while discussing, arranging, or
                    delivering advisory services
                  </li>

                  <li>
                    Correspondence, meeting details, service records, and
                    appropriate business records
                  </li>

                  <li>
                    Basic technical, verification, session, and usage
                    information required for website operation, security,
                    fraud prevention, access control, and performance
                  </li>

                  <li>
                    Payment, billing, and transaction information where you
                    purchase services, although full card details are generally
                    processed by the relevant payment provider rather than by
                    Van Esch Advisory Ltd
                  </li>
                </ul>

                <p>
                  Please avoid submitting unnecessary special category or
                  sensitive Personal Data through public website forms or the HR
                  Operations Health Check.
                </p>
              </div>
            </section>

            {/* SOURCES OF PERSONAL DATA */}
            <section>
              <p className="brand-section-kicker">
                How information is collected
              </p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Sources of Personal Data
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>We may collect Personal Data when you:</p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>Visit or use the website</li>
                  <li>Submit a contact or enquiry form</li>
                  <li>Communicate with us about potential services</li>
                  <li>Complete the public HR Operations Health Check</li>

                  <li>
                    Participate in a client diagnostic or Client Fact Pack
                    after being invited as part of a client engagement
                  </li>

                  <li>Book a meeting or consultation</li>
                  <li>Enter into or receive services under a contract</li>
                  <li>Make a payment for services</li>
                  <li>Communicate with us by email or another agreed channel</li>
                </ul>

                <p>
                  We may also receive relevant Personal Data from consulting
                  clients, professional advisers, service providers, publicly
                  available business sources, or other parties where there is a
                  lawful basis for doing so. For example, a consulting client
                  may provide a participant&apos;s name and business email
                  address so that they can be invited to participate in a
                  client diagnostic.
                </p>
              </div>
            </section>

            {/* PURPOSES OF PROCESSING */}
            <section>
              <p className="brand-section-kicker">Why information is used</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Purposes of processing
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>We may use Personal Data to:</p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>Respond to contact requests and business enquiries</li>

                  <li>
                    Assess whether our services may be relevant to your
                    organisation
                  </li>

                  <li>
                    Provide and improve the public HR Operations Health Check
                  </li>

                  <li>
                    Administer client diagnostic and Client Fact Pack
                    participation as part of advisory engagements
                  </li>

                  <li>
                    Verify invited participants and maintain secure access to
                    client diagnostic services
                  </li>

                  <li>
                    Generate diagnostic scores, summaries, indicative outputs,
                    and related context from submitted responses
                  </li>

                  <li>
                    Review an enquiry alongside related Health Check or
                    diagnostic information
                  </li>

                  <li>
                    Arrange, administer, and deliver requested advisory services
                  </li>

                  <li>
                    Manage client relationships, projects, meetings, and
                    communications
                  </li>

                  <li>
                    Process payments and maintain appropriate financial,
                    accounting, and tax records
                  </li>

                  <li>
                    Understand patterns across submissions using aggregated,
                    anonymised, or de-identified information
                  </li>

                  <li>
                    Operate, maintain, secure, monitor, and improve the website
                    and related systems
                  </li>

                  <li>
                    Prevent fraud, misuse, unauthorised access, and other
                    security threats
                  </li>

                  <li>
                    Maintain appropriate business, legal, regulatory, and
                    compliance records
                  </li>

                  <li>
                    Establish, exercise, or defend legal rights and claims
                  </li>

                  <li>
                    Send optional marketing communications where permitted and
                    where the required consent or other lawful basis exists
                  </li>
                </ul>
              </div>
            </section>

            {/* LAWFUL BASES */}
            <section>
              <p className="brand-section-kicker">Lawful bases</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Why this processing is lawful
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  The lawful basis relied upon depends on the nature and context
                  of the processing. It may include:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong>
                      Contract or steps before entering into a contract
                    </strong>{" "}
                    where processing is necessary to respond to a request for
                    services, discuss a potential engagement, administer a
                    contract, or deliver requested services
                  </li>

                  <li>
                    <strong>Legitimate interests</strong> in operating,
                    maintaining, securing, and improving the website;
                    responding to genuine business enquiries; providing and
                    improving the Health Check; administering secure client
                    services; maintaining appropriate business records;
                    managing professional relationships; and protecting the
                    company, its systems, clients, and users
                  </li>

                  <li>
                    <strong>Legal obligation</strong> where processing is
                    required for tax, accounting, company, regulatory,
                    compliance, or other legal purposes
                  </li>

                  <li>
                    <strong>Consent</strong> where consent is specifically
                    requested and is the appropriate lawful basis, such as for
                    certain optional marketing communications or non-essential
                    cookies
                  </li>
                </ul>

                <p>
                  Consent is not relied upon as the lawful basis for all website
                  or Health Check processing. Where consent is relied upon, you
                  may withdraw it at any time. Withdrawal does not affect the
                  lawfulness of processing carried out before consent was
                  withdrawn.
                </p>

                <p>
                  Where Van Esch Advisory Ltd acts only as a processor on
                  behalf of a consulting client, the client is responsible as
                  controller for determining the relevant lawful basis for that
                  processing. Van Esch Advisory Ltd processes the relevant
                  Personal Data in accordance with the client&apos;s documented
                  instructions and applicable contractual arrangements.
                </p>
              </div>
            </section>

            {/* PUBLIC HR OPERATIONS HEALTH CHECK */}
            <section>
              <p className="brand-section-kicker">
                HR Operations Health Check
              </p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                How public Health Check information is handled
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  The HR Operations Health Check is a publicly accessible
                  practical self-assessment tool. Information submitted through
                  the tool is used to generate your result, provide an
                  indicative view of HR operational maturity, and support
                  understanding of common operational patterns over time.
                </p>

                <p>
                  Health Check information may include your responses,
                  organisation context, results, scores, bands, summaries,
                  recommendations, and other outputs derived from the
                  information submitted.
                </p>

                <p>
                  Where benchmark or trend information is created from Health
                  Check submissions, it is intended to be used in aggregated,
                  anonymised, or de-identified form so that individual people
                  or organisations are not identified.
                </p>

                <p>
                  If you provide contact details or submit an enquiry, your
                  Health Check responses, scores, and related contextual
                  information may be linked to your enquiry and associated with
                  your contact details.
                </p>

                <p>
                  This linkage allows the enquiry to be reviewed in context and
                  supports a more informed, relevant, and practical response. It
                  is not used to make solely automated decisions that produce
                  legal or similarly significant effects.
                </p>

                <p>
                  Health Check information linked to an enquiry may be used for
                  handling that enquiry, supporting follow-up discussions,
                  evaluating potential services, and providing advisory
                  services where relevant.
                </p>
              </div>
            </section>

            {/* CLIENT-ONLY DIAGNOSTICS */}
            <section>
              <p className="brand-section-kicker">
                Client diagnostic services
              </p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Invited diagnostic participants
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  Van Esch Advisory Ltd may provide client organisations with
                  access to comprehensive diagnostic services and Client Fact
                  Packs as part of an advisory engagement. These services are
                  not publicly accessible and participation is provided by
                  invitation.
                </p>

                <p>
                  Depending on the engagement, diagnostic information may
                  include participant responses, organisational context,
                  ratings, comments, fact-pack information, scores, themes,
                  summaries, and outputs derived from submitted information.
                </p>

                <p>
                  Where you are invited to participate, we may use your
                  registered email address to send a one-time verification
                  code. Verification and session information is processed to
                  confirm authorised access, prevent misuse, and protect client
                  diagnostic information from unauthorised access.
                </p>

                <p>
                  Email verification codes are temporary and are not stored in
                  readable form after they are issued. Successful verification
                  may create a temporary secure session linked to the relevant
                  diagnostic invitation so that verification does not need to
                  be repeated on every page or request.
                </p>

                <p>
                  Diagnostic information collected as part of a client
                  engagement may be reviewed and analysed alongside other
                  relevant project evidence to support the delivery of advisory
                  services to the client.
                </p>

                <p>
                  Where Van Esch Advisory Ltd processes participant information
                  solely on behalf of a client, the client may be the data
                  controller and Van Esch Advisory Ltd may act as its processor,
                  subject to the applicable contractual and data-processing
                  arrangements.
                </p>
              </div>
            </section>

            {/* AI-ASSISTED PROCESSING */}
            <section>
              <p className="brand-section-kicker">
                AI-assisted processing
              </p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Use of AI-assisted tools
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  Van Esch Advisory Ltd may use appropriately configured
                  AI-assisted tools to support activities such as analysing
                  diagnostic information, identifying themes, preparing draft
                  summaries, organising information, or supporting advisory
                  work.
                </p>

                <p>
                  AI-assisted outputs are used as support tools and may be
                  subject to human review, professional judgement, and further
                  validation where appropriate. We do not rely on AI-assisted
                  processing to make solely automated decisions about
                  individuals that produce legal or similarly significant
                  effects.
                </p>

                <p>
                  Personal Data is only provided to AI or technology service
                  providers where there is an appropriate purpose, lawful
                  basis, contractual arrangement, and level of security.
                </p>
              </div>
            </section>

            {/* BROWSER STORAGE AND VERIFICATION COOKIE */}
            <section>
              <p className="brand-section-kicker">Browser storage</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Browser-based data storage
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  Information entered into the public HR Operations Health
                  Check may be stored locally in your browser to allow you to
                  continue or resume the assessment.
                </p>

                <p>
                  This information is stored on your device and can be cleared
                  by resetting the assessment or clearing your browser&apos;s
                  local storage.
                </p>

                <p>
                  The website may also use cookies or similar technologies that
                  are necessary for security and basic operation. Optional or
                  non-essential cookies will only be used where an appropriate
                  consent mechanism applies.
                </p>

                <p>
                  Where an invited participant accesses a client diagnostic or
                  Client Fact Pack, a strictly necessary first-party
                  verification cookie may be used after successful email
                  verification. The cookie contains a randomly generated session
                  identifier rather than the verification code or diagnostic
                  responses, and normally expires after 12 hours.
                </p>

                <p>
                  The corresponding verified session may end sooner if the
                  invitation expires or is revoked, the client project is
                  closed, or participation is completed or withdrawn.
                </p>

                <p>
                  Further information about cookies and browser storage is
                  available in our{" "}
                  <Link href="/cookies" className="brand-link font-medium">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* SERVICE PROVIDERS AND SHARING */}
            <section>
              <p className="brand-section-kicker">Sharing information</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Who information may be shared with
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  We may use trusted service providers to operate the website,
                  communicate with users, store information, arrange meetings,
                  manage business records, deliver services, and process
                  payments.
                </p>

                <p>
                  Depending on the relevant service and contractual
                  arrangements, providers acting as processors or subprocessors
                  may include:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    Supabase for database, authentication, verification, and
                    data storage
                  </li>

                  <li>
                    Resend for transactional email delivery, including
                    verification emails
                  </li>

                  <li>
                    Google Workspace and Microsoft 365 for business
                    communications, productivity, and document management
                  </li>

                  <li>
                    Cloudflare for hosting, delivery, performance, and security
                    services
                  </li>

                  <li>
                    GitHub for source-code management and deployment
                    infrastructure
                  </li>

                  <li>
                    Calendly for scheduling, where that service remains in use
                  </li>

                  <li>
                    Other appropriately selected technology, hosting, security,
                    professional, or administrative service providers
                  </li>
                </ul>

                <p>
                  The website may include embedded maps or other limited
                  third-party features. When you interact with those features,
                  the relevant third party may receive technical information or
                  act as an independent controller under its own privacy terms.
                </p>

                <p>
                  Where card payments are accepted through FreeAgent, Stripe,
                  or another payment provider, the payment provider may process
                  payment and transaction information as a processor or as an
                  independent controller, depending on the service and legal
                  context. Van Esch Advisory Ltd does not generally receive or
                  store complete payment card details.
                </p>

                <p>
                  Other organisations that may act as independent controllers
                  include banks, payment providers, insurers, accountants,
                  lawyers, professional advisers, regulators, public
                  authorities, and other organisations that determine their own
                  purposes and means of processing.
                </p>

                <p>
                  Personal Data may also be disclosed where required by law, to
                  protect legal rights, to prevent fraud or security incidents,
                  or in connection with a legitimate corporate transaction.
                </p>

                <p>Personal Data is not sold to third parties.</p>
              </div>
            </section>

            {/* INTERNATIONAL DATA TRANSFERS */}
            <section>
              <p className="brand-section-kicker">
                International data transfers
              </p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Processing outside the United Kingdom
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  Some technology and service providers may process, host,
                  access, or support information from locations outside the
                  United Kingdom or European Economic Area.
                </p>

                <p>
                  Where international transfers are subject to data protection
                  transfer restrictions, we take steps intended to ensure that
                  an appropriate lawful transfer mechanism and suitable
                  protections are in place.
                </p>

                <p>Depending on the circumstances, safeguards may include:</p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>UK adequacy regulations</li>
                  <li>The UK International Data Transfer Agreement</li>

                  <li>
                    The UK Addendum to the European Commission&apos;s Standard
                    Contractual Clauses
                  </li>

                  <li>
                    The European Commission&apos;s Standard Contractual Clauses
                  </li>

                  <li>
                    Another lawful transfer mechanism or applicable statutory
                    exemption
                  </li>
                </ul>

                <p>
                  The precise location and transfer arrangements may depend on
                  the provider, service configuration, and nature of the
                  processing.
                </p>
              </div>
            </section>

            {/* SECURITY */}
            <section>
              <p className="brand-section-kicker">Security</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                How information is protected
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  We use reasonable technical and organisational measures
                  intended to protect Personal Data against unauthorised
                  access, loss, misuse, alteration, or disclosure.
                </p>

                <p>
                  Measures may include access controls, authentication,
                  verification, encryption in transit, secure hosting and
                  database services, software maintenance, monitoring, backups,
                  and limiting access to people and providers who require it
                  for an authorised purpose.
                </p>

                <p>
                  No internet transmission or information-storage system can be
                  guaranteed to be completely secure. You should therefore take
                  appropriate care when submitting information online.
                </p>
              </div>
            </section>

            {/* RETENTION */}
            <section>
              <p className="brand-section-kicker">Retention</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                How long information is kept
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  We retain Personal Data only for as long as reasonably
                  necessary for the purpose for which it was collected,
                  including responding to enquiries, delivering services,
                  maintaining appropriate business records, complying with
                  legal obligations, and establishing, exercising, or
                  defending legal claims.
                </p>

                <p>
                  Short-lived authentication and verification information is
                  used only for the period required to provide and secure the
                  relevant access. A verified client diagnostic browser session
                  normally expires after 12 hours and may end earlier where the
                  underlying invitation or participation is no longer valid.
                </p>

                <p>
                  The appropriate retention period for other information
                  depends on factors including the nature of the information,
                  the relationship with the individual or organisation, legal
                  and regulatory requirements, security considerations, and
                  whether the information is required for an existing or
                  potential claim.
                </p>

                <p>
                  Information may be deleted, anonymised, or securely archived
                  when it is no longer reasonably required.
                </p>
              </div>
            </section>

            {/* DATA PROTECTION RIGHTS */}
            <section>
              <p className="brand-section-kicker">Your rights</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Data protection rights
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  Depending on the circumstances and applicable law, you may
                  have the right to:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>Request access to your Personal Data</li>
                  <li>Request correction of inaccurate or incomplete data</li>
                  <li>Request erasure of your Personal Data</li>
                  <li>Request restriction of processing</li>
                  <li>Object to processing based on legitimate interests</li>
                  <li>Object to processing for direct marketing</li>

                  <li>
                    Request the transfer of certain information to you or
                    another organisation
                  </li>

                  <li>
                    Withdraw consent where processing is based on consent
                  </li>

                  <li>
                    Complain to the Information Commissioner&apos;s Office
                  </li>
                </ul>

                <p>
                  These rights are subject to legal conditions, limitations,
                  and exemptions. They will not apply in every circumstance.
                </p>

                <p>
                  We may need to request information to confirm your identity
                  before responding to a rights request. We may also ask for
                  clarification where necessary to identify the information or
                  processing concerned.
                </p>

                <p>
                  There is normally no fee for exercising your data protection
                  rights. However, applicable law may permit a reasonable fee
                  or refusal where a request is manifestly unfounded or
                  excessive.
                </p>
              </div>
            </section>

            {/* COMPLAINTS */}
            <section>
              <p className="brand-section-kicker">Complaints</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Raising a data protection concern
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <p>
                  Please contact us first if you have a concern about how we
                  use your Personal Data, so that we have an opportunity to
                  investigate and respond.
                </p>

                <p>
                  You also have the right to complain to the{" "}
                  <a
                    href="https://ico.org.uk/make-a-complaint/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-link font-medium"
                  >
                    Information Commissioner&apos;s Office
                  </a>
                  , the United Kingdom supervisory authority for data
                  protection.
                </p>

                <p>
                  You are not required to complain to Van Esch Advisory Ltd
                  before contacting the Information Commissioner&apos;s Office.
                </p>
              </div>
            </section>

            {/* PRIVACY CONTACT */}
            <section>
              <p className="brand-section-kicker">Contact</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Privacy enquiries and rights requests
              </h2>

              <div className="brand-body mt-4 space-y-4">
                <address className="not-italic">
                  <strong>Data Protection Contact:</strong> Gregory van Esch
                  <br />
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:privacy@vanesch.uk"
                    className="brand-link font-medium"
                  >
                    privacy@vanesch.uk
                  </a>
                  <br />
                  <strong>Postal address:</strong>
                  <br />
                  Van Esch Advisory Ltd
                  <br />
                  17 Heather Way
                  <br />
                  Harwell
                  <br />
                  Didcot
                  <br />
                  Oxfordshire
                  <br />
                  OX11 6JZ
                  <br />
                  United Kingdom
                </address>

                <p>
                  Privacy rights requests, privacy complaints, and other
                  data-protection enquiries should be sent to{" "}
                  <a
                    href="mailto:privacy@vanesch.uk"
                    className="brand-link font-medium"
                  >
                    privacy@vanesch.uk
                  </a>
                  .
                </p>

                <Link href="/contact" className="brand-link font-medium">
                  General contact form
                </Link>
              </div>
            </section>

            {/* DOCUMENT CONTROL */}
            <section>
              <p className="brand-section-kicker">Document control</p>

              <h2 className="brand-heading-md mt-3 text-slate-950">
                Policy information
              </h2>

              <div className="brand-body mt-4 space-y-2">
                <p>
                  <strong>Last updated:</strong> 12 August 2026
                </p>

                <p>
                  <strong>Version:</strong> 2.1
                </p>

                <p>
                  We may update this Privacy Policy periodically to reflect
                  changes to our services, technology, suppliers, processing
                  activities, or legal obligations. The updated version will
                  be published on this page.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
