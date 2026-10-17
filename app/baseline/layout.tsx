import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "team.blue | Current work baseline" },
  description:
    "A private baseline to understand current work and improve support at team.blue.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "team.blue | Current work baseline",
    description: "A private team.blue current work baseline.",
    siteName: "team.blue baseline",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "team.blue | Current work baseline",
    description: "A private team.blue current work baseline.",
    images: [],
  },
};

export default function BaselineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
