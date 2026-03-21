"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navigation = [
  { href: "/services", label: "Services" },
  { href: "/diagnostic", label: "Diagnostic" },
  { href: "/approach", label: "Approach" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  function handleCloseMenu() {
    setOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="brand-container">
        <div className="flex min-h-[var(--site-header-height)] items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center"
            aria-label="Van Esch home"
            onClick={handleCloseMenu}
          >
            <div className="relative w-[120px] sm:w-[150px] md:w-[180px] lg:w-[220px] xl:w-[260px] h-[32px] sm:h-[36px] md:h-[40px] lg:h-[48px] xl:h-[56px]">
              <Image
                src="/brand/logo-header.svg"
                alt="Van Esch"
                fill
                priority
                sizes="(max-width: 640px) 120px,
                       (max-width: 768px) 150px,
                       (max-width: 1024px) 180px,
                       (max-width: 1280px) 220px,
                       260px"
                className="object-contain"
              />
            </div>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 lg:flex xl:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap transition hover:text-[#1E6FD9]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/contact"
              className="brand-button-primary hidden whitespace-nowrap px-4 py-2 text-sm font-semibold xl:inline-flex"
            >
              Book Diagnostic Conversation
            </Link>

            <button
              type="button"
              className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:hidden"
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              Menu
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-slate-200 pb-5 pt-4 lg:hidden">
            <nav className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleCloseMenu}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-[#1E6FD9]"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/contact"
                onClick={handleCloseMenu}
                className="brand-button-primary mt-3 justify-center px-4 py-2 text-sm font-semibold"
              >
                Book Diagnostic Conversation
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}