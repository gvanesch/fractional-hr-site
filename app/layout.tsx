"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greg van Esch | HR Operations & Transformation Advisor",
  description:
    "Independent advisor specialising in HR operations, service delivery, shared services, ServiceNow HRSD, knowledge management, onboarding automation, and HR transformation.",
};

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex items-center justify-between py-4">
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

        {open && (
          <div className="border-t border-slate-200 py-4 md:hidden">
            <nav className="flex flex-col gap-4 text-sm font-medium text-slate-700">
              <Link href="/services" onClick={() => setOpen(false)}>
                Services
              </Link>
              <Link href="/case-studies" onClick={() => setOpen(false)}>
                Case Studies
              </Link>
              <Link href="/about" onClick={() => setOpen(false)}>
                About
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)}>
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Header />

        <main>{children}</main>

        <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
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
      </body>
    </html>
  );
}