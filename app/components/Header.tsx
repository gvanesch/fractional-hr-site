"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex items-center justify-between py-4">

          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-2xl font-semibold tracking-tight text-slate-950"
            >
              Greg van Esch
            </Link>

            <p className="mt-1 text-base text-slate-600">
              HR Operations &amp; Transformation Advisor
            </p>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden gap-8 text-base font-medium text-slate-700 md:flex">

            <Link
              href="/services"
              className="transition hover:text-[#1E6FD9]"
            >
              Services
            </Link>

            <Link
              href="/approach"
              className="transition hover:text-[#1E6FD9]"
            >
              Approach
            </Link>

            <Link
              href="/case-studies"
              className="transition hover:text-[#1E6FD9]"
            >
              Case Studies
            </Link>

            <Link
              href="/about"
              className="transition hover:text-[#1E6FD9]"
            >
              About
            </Link>

            <Link
              href="/pricing"
              className="transition hover:text-[#1E6FD9]"
            >
              Pricing
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-[#1E6FD9]"
            >
              Contact
            </Link>

          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-4">

            {/* CTA Button */}
            <Link
              href="/contact"
              className="hidden rounded-lg bg-[#1E6FD9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1557AD] md:block"
            >
              Book Diagnostic Call
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 md:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              Menu
            </button>

          </div>
        </div>

        {/* Mobile Navigation */}
        {open && (
          <div className="border-t border-slate-200 pb-6 pt-4 md:hidden">
            <nav className="flex flex-col gap-4 text-base font-medium text-slate-700">

              <Link
                href="/services"
                onClick={() => setOpen(false)}
                className="transition hover:text-[#1E6FD9]"
              >
                Services
              </Link>

              <Link
                href="/approach"
                onClick={() => setOpen(false)}
                className="transition hover:text-[#1E6FD9]"
              >
                Approach
              </Link>

              <Link
                href="/case-studies"
                onClick={() => setOpen(false)}
                className="transition hover:text-[#1E6FD9]"
              >
                Case Studies
              </Link>

              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="transition hover:text-[#1E6FD9]"
              >
                About
              </Link>

              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="transition hover:text-[#1E6FD9]"
              >
                Pricing
              </Link>

              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="transition hover:text-[#1E6FD9]"
              >
                Contact
              </Link>

              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-[#1E6FD9] px-4 py-2 text-center font-semibold text-white"
              >
                Book Diagnostic Call
              </Link>

            </nav>
          </div>
        )}

      </div>
    </header>
  );
}