import { notFound } from "next/navigation";
import { baselineEnv } from "@/lib/baseline/server";
import SharedDashboard from "./shared";
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "team.blue | Baseline completion" },
  robots: { index: false, follow: false },
};
export default function Page() {
  try {
    baselineEnv();
  } catch {
    notFound();
  }
  return <SharedDashboard />;
}
