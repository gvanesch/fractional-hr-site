import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}