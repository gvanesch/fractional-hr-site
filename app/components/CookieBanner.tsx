"use client";

import Link from "next/link";
import { useState } from "react";

const STORAGE_KEY = "vanesch_cookie_notice_acknowledged";

function getInitialVisibility(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) !== "true";
}

export default function CookieBanner() {
  const [visible, setVisible] = useState<boolean>(getInitialVisibility);

  const handleAccept = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#0D1F3C] p-5 text-white shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8AAAC8]">
              Cookies
            </p>
            <p className="mt-2 text-base leading-7 text-[#8AAAC8]">
              This website uses technologies necessary for its operation and
              limited third-party services, such as embedded maps, which may set
              their own cookies when used. You can read more in the{" "}
              <Link
                href="/cookies"
                className="font-medium text-white underline underline-offset-4"
              >
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-white underline underline-offset-4"
              >
                Privacy Policy
              </Link>.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/cookies"
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Read Policy
            </Link>
            <button
              type="button"
              onClick={handleAccept}
              className="rounded-xl bg-[#1E6FD9] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2979FF]"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}