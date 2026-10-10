import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { baselineEnv } from "@/lib/baseline/server";
import BaselineJourney from "./journey";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "team.blue | Current work baseline" },
  robots: { index: false, follow: false },
};
export default function Page() {
  try {
    baselineEnv();
  } catch {
    notFound();
  }
  return <BaselineJourney />;
}
