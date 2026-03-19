import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="brand-container py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <p className="text-base font-semibold text-slate-950">
              Van Esch Advisory Ltd
            </p>
            <p className="max-w-xs text-sm text-slate-600">
              HR Operations, Service Delivery, and Transformation Advisory for
              scaling organisations.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-950">Explore</p>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/services" className="hover:text-[#1E6FD9]">
                Services
              </Link>
              <Link href="/diagnostic" className="hover:text-[#1E6FD9]">
                Diagnostic
              </Link>
              <Link href="/approach" className="hover:text-[#1E6FD9]">
                Approach
              </Link>
              <Link href="/about" className="hover:text-[#1E6FD9]">
                About
              </Link>
              <Link href="/pricing" className="hover:text-[#1E6FD9]">
                Pricing
              </Link>
              <Link href="/contact" className="hover:text-[#1E6FD9]">
                Contact
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-950">Legal</p>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-[#1E6FD9]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-[#1E6FD9]">
                Terms of Use
              </Link>
              <Link href="/cookies" className="hover:text-[#1E6FD9]">
                Cookie Policy
              </Link>
              <Link href="/modern-slavery" className="hover:text-[#1E6FD9]">
                Modern Slavery Statement
              </Link>
            </div>

            <div className="pt-2">
              <a
                href="https://www.linkedin.com/in/greg-van-esch/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-600 hover:text-[#1E6FD9]"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} Van Esch Advisory Ltd. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}