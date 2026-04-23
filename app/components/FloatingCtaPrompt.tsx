"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const HIDDEN_ROUTES = new Set([
    "/diagnostic",
    "/diagnostic-assessment",
    "/contact",
    "/contact/diagnostic-interpretation",
]);

export default function FloatingCtaPrompt() {
    const pathname = usePathname();
    const [hasScrolledEnough, setHasScrolledEnough] = useState(false);
    const [footerVisible, setFooterVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const shouldHideForRoute = useMemo(() => {
        if (!pathname) {
            return false;
        }

        return HIDDEN_ROUTES.has(pathname);
    }, [pathname]);

    useEffect(() => {
        setDismissed(false);
        setHasScrolledEnough(false);
        setFooterVisible(false);
    }, [pathname]);

    useEffect(() => {
        if (shouldHideForRoute) {
            setHasScrolledEnough(false);
            return;
        }

        function handleScroll() {
            setHasScrolledEnough(window.scrollY > 1000);
        }

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [shouldHideForRoute]);

    useEffect(() => {
        if (shouldHideForRoute) {
            setFooterVisible(false);
            return;
        }

        const footer = document.querySelector("footer");

        if (!footer) {
            setFooterVisible(false);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setFooterVisible(entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0.05,
            },
        );

        observer.observe(footer);

        return () => {
            observer.disconnect();
        };
    }, [shouldHideForRoute]);

    const isVisible =
        !shouldHideForRoute && !dismissed && hasScrolledEnough && !footerVisible;

    return (
        <div
            className={[
                "pointer-events-none fixed bottom-4 right-4 z-40 transition-all duration-300 sm:bottom-5 sm:right-5",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            ].join(" ")}
            aria-hidden={!isVisible}
        >
            <div className="pointer-events-auto w-[min(15.75rem,calc(100vw-1.5rem))] rounded-[1rem] border border-white/8 bg-[rgba(10,22,40,0.52)] p-2 shadow-[0_6px_16px_rgba(2,12,27,0.12)] backdrop-blur-md sm:w-[15.75rem]">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDismissed(true)}
                        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[#8AAAC8] transition hover:bg-white/8 hover:text-white"
                        aria-label="Dismiss prompt"
                    >
                        ×
                    </button>

                    <div className="grid grid-cols-2 gap-1.5 pr-6">
                        <Link
                            href="/diagnostic"
                            className="inline-flex min-h-[2.6rem] w-full items-center justify-center rounded-[0.75rem] bg-[#1E6FD9] px-2 py-1.5 text-center text-[0.75rem] font-semibold leading-4 text-white transition hover:bg-[#2979FF]"
                        >
                            <span className="block max-w-[5rem] text-center">
                                Take the Health Check
                            </span>
                        </Link>

                        <Link
                            href="/contact"
                            className="inline-flex min-h-[2.6rem] w-full items-center justify-center rounded-[0.75rem] border border-white/18 px-2 py-1.5 text-center text-[0.75rem] font-semibold leading-4 text-white/88 transition hover:bg-white/8 hover:text-white"
                        >
                            <span className="block max-w-[5rem] text-center">
                                Start a conversation
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}