import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { baselineEnv } from "@/lib/baseline/server";
import AdminPanel from "../../panel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "team.blue | Baseline project workspace" },
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  try {
    baselineEnv();
  } catch {
    notFound();
  }
  if (!(await requireAdvisorUser())) redirect("/advisor/login");
  const { campaignId } = await params;
  if (!/^[a-f0-9-]{36}$/.test(campaignId)) notFound();
  return <AdminPanel key={campaignId} initialCampaign={campaignId} />;
}
