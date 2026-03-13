import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import Header from "./components/Header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vanesch.uk"),
  title: "Greg van Esch | HR Operations & Transformation Advisor",
  description:
    "Independent advisor specialising in HR operations, service delivery, shared services, ServiceNow HRSD, knowledge management, onboarding automation, and HR transformation.",
  alternates: {
    canonical: "https://vanesch.uk",
  },
  openGraph: {
    title: "Greg van Esch | HR Operations & Transformation Advisor",
    description:
      "Independent advisor specialising in HR operations, service delivery, shared services, ServiceNow HRSD, knowledge management, onboarding automation, and HR transformation.",
    url: "https://vanesch.uk",
    siteName: "Greg van Esch",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://vanesch.uk/og-image.jpg",
        secureUrl: "https://vanesch.uk/og-image.jpg",
        width: 1200,
        height: 672,
        alt: "Greg van Esch | HR Operations & Transformation Advisor",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Greg van Esch | HR Operations & Transformation Advisor",
    description:
      "Independent advisor specialising in HR operations, service delivery, shared services, ServiceNow HRSD, knowledge management, onboarding automation, and HR transformation.",
    images: ["https://vanesch.uk/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}
      >
        <Header />
        <main>{children}</main>

        <footer className="border-t border-slate-200 bg-[#0D1F3C] text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xl font-semibold text-white">Greg van Esch</p>
              <p className="mt-2 text-base text-[#8AAAC8]">
                HR Operations & Transformation Advisor
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-base text-[#8AAAC8]">
              <Link href="/services" className="transition hover:text-white">
                Services
              </Link>
              <Link href="/approach" className="transition hover:text-white">
                Approach
              </Link>
              <Link href="/about" className="transition hover:text-white">
                About
              </Link>
              <Link href="/case-studies" className="transition hover:text-white">
                Case Studies
              </Link>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
              <a
                href="https://www.linkedin.com/in/greg-van-esch/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}