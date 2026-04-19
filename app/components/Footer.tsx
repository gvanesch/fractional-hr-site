import Image from "next/image";
import Link from "next/link";

const exploreLinks = [
  // Primary entry + core pathway
  { href: "/diagnostic", label: "Health Check" },
  { href: "/diagnostic-assessment", label: "Diagnostic Assessment" },
  { href: "/services", label: "Services" },

  // Supporting pages
  { href: "/approach", label: "Approach" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/modern-slavery", label: "Modern Slavery Statement" },
  {
    href: "https://www.linkedin.com/in/greg-van-esch/",
    label: "LinkedIn",
    external: true,
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-[#F4F6FA]">
      <div className="brand-container py-14">
        <div className="grid gap-10 md:grid-cols-3 md:items-start">
          <div className="space-y-5">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="Van Esch Advisory Ltd home"
            >
              <div className="relative h-[44px] w-[210px] sm:h-[48px] sm:w-[230px]">
                <Image
                  src="/brand/logo-header.svg"
                  alt="Van Esch Advisory Ltd"
                  fill
                  sizes="230px"
                  className="object-contain object-left"
                />
              </div>
            </Link>

            <p className="max-w-xs text-sm leading-7 text-slate-500">
              HR Operations, Service Delivery, and Transformation Advisory for
              growing and complex organisations.
            </p>
          </div>

          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-900">Explore</h3>

            <nav className="flex flex-col gap-3">
              {exploreLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-500 transition hover:text-[#1E6FD9]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-5">
            <h3 className="text-base font-semibold text-slate-900">Legal</h3>

            <nav className="flex flex-col gap-3">
              {legalLinks.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-slate-500 transition hover:text-[#1E6FD9]"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-slate-500 transition hover:text-[#1E6FD9]"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
        </div>

        <div className="brand-divider mt-10" />

        <div className="pt-6 text-sm text-slate-400">
          © {year} Van Esch Advisory Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}