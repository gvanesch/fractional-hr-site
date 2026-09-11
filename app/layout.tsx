import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/app/components/CookieBanner";

export const metadata: Metadata = {
  metadataBase: new URL("https://vanesch.uk"),

  title: {
    default: "Van Esch Advisory Ltd",
    template: "%s | Van Esch Advisory Ltd",
  },

  description:
    "HR Operations, Service Delivery, and Transformation Advisory for scaling and complex organisations.",

  openGraph: {
    title: "Van Esch Advisory Ltd",
    description:
      "HR Operations, Service Delivery, and Transformation Advisory.",
    url: "https://vanesch.uk",
    siteName: "Van Esch Advisory Ltd",
    type: "website",
  },
};

function QaEnvironmentMarker() {
  const environment = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();

  if (environment !== "qa" && environment !== "local") {
    return null;
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-[100] border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-amber-950"
    >
      QA environment · synthetic data only
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QaEnvironmentMarker />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
