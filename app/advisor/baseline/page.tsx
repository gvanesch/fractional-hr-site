import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { baselineEnv } from "@/lib/baseline/server";
import ProjectList from "./projects";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "team.blue baseline administration",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  try {
    baselineEnv();
  } catch {
    notFound();
  }
  if (!(await requireAdvisorUser())) redirect("/advisor/login");
  const requested = (await searchParams).campaign ?? "";
  if (/^[a-f0-9-]{36}$/.test(requested))
    redirect("/advisor/baseline/project/" + requested);
  return <ProjectList />;
}
