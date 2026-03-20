import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTopOnRouteChange from "./components/ScrollToTopOnRouteChange";

export const metadata: Metadata = {
  title: "Van Esch Advisory Ltd",
  description:
    "HR Operations, Service Delivery, and Transformation Advisory for scaling organisations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A1628] text-white antialiased overflow-x-hidden">
        <div className="min-h-screen flex flex-col">
          <Header />

          <Suspense fallback={null}>
            <ScrollToTopOnRouteChange />
          </Suspense>

          <div className="site-header-spacer" aria-hidden="true" />

          <main className="flex-1 w-full overflow-x-hidden">{children}</main>

          <Footer />
        </div>
      </body>
    </html>
  );
}