import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";

export const metadata: Metadata = {
  metadataBase: new URL("https://vanesch.uk"),
  title: {
    default: "Van Esch Advisory",
    template: "%s | Van Esch Advisory",
  },
  description:
    "HR Operations, Service Delivery, and Transformation Advisory for scaling organisations.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Van Esch Advisory",
    description:
      "HR Operations, Service Delivery, and Transformation Advisory for scaling organisations.",
    url: "https://vanesch.uk",
    siteName: "Van Esch Advisory",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Van Esch Advisory",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Van Esch Advisory",
    description:
      "HR Operations, Service Delivery, and Transformation Advisory for scaling organisations.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Header />
        {children}
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}