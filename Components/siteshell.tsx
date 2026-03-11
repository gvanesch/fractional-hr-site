import Link from "next/link";
import { ReactNode } from "react";

type SiteShellProps = {
  children: ReactNode;
};

export default function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight text-slate-950">
              Greg van Esch
            </Link>
            <p className="text-sm text-slate-500">HR Operations & Transformation Advisor</p>
          </div>

          <nav className="hidden gap-8 text-sm font-medium text-slate-700 md:flex">
            <Link href="/services" className="transition hover:text-blue-600">
              Services
            </Link>
            <Link href="/case-studies" className="transition hover:text-blue-600">
              Case Studies
            </Link>
            <Link href="/about" className="transition hover:text-blue-600">
              About
            </Link>
            <Link href="/contact" className="transition hover:text-blue-600">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Greg van Esch</p>
            <p className="mt-1 text-sm text-slate-400">HR Operations & Transformation Advisor</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
            <a href="mailto:info@vanesch.uk" className="transition hover:text-white">
              info@vanesch.uk
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}