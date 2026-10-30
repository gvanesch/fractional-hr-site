import type { Metadata } from "next";
export const metadata: Metadata = {
  title: { default: "team.blue | Baseline", template: "%s | team.blue" },
  description: "team.blue current work baseline",
  openGraph: {
    title: "team.blue | Current work baseline",
    description: "team.blue current work baseline",
    siteName: "team.blue",
    images: [],
  },
  twitter: {
    title: "team.blue | Current work baseline",
    description: "team.blue current work baseline",
    images: [],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
