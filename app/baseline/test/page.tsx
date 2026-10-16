import { notFound } from "next/navigation";
import { baselineEnv } from "@/lib/baseline/server";
import TestAccess from "./test-access";
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "team.blue | Current work baseline test" },
  robots: { index: false, follow: false },
};
export default function Page() {
  try {
    if (baselineEnv().NEXT_PUBLIC_APP_ENV !== "qa") notFound();
  } catch {
    notFound();
  }
  return <TestAccess />;
}
