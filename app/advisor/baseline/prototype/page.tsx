import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { baselineEnv } from "@/lib/baseline/server";
import Prototype from "./prototype";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "team.blue baseline design prototype",
  robots: { index: false, follow: false },
};
export default async function Page() {
  try {
    if (baselineEnv().NEXT_PUBLIC_APP_ENV !== "qa") notFound();
  } catch {
    notFound();
  }
  if (!(await requireAdvisorUser())) redirect("/advisor/login");
  return <Prototype />;
}
