import { redirect } from "next/navigation";
import AdvisorNav from "@/app/components/advisor/AdvisorNav";
import { requireAdvisorUser } from "@/lib/advisor-auth";

export const runtime = "edge";

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdvisorNav />
      {children}
    </div>
  );
}