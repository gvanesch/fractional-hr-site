import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { baselineEnv } from "@/lib/baseline/server";
import Prototype from "./prototype";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "team.blue baseline design prototype",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ manager?: string }>;
}) {
  try {
    if (baselineEnv().NEXT_PUBLIC_APP_ENV !== "qa") notFound();
  } catch {
    notFound();
  }
  if (!(await requireAdvisorUser())) redirect("/advisor/login");
  const manager = (await searchParams).manager !== "no";
  return (
    <>
      <aside className="tb-shell">
        <p>
          QA participant example:{" "}
          {manager
            ? "Confirmed people manager with 6 direct reports"
            : "Not a people manager"}
          . This is a synthetic roster record.
        </p>
        <a href={manager ? "?manager=no" : "?manager=yes"}>
          Preview {manager ? "a non-manager" : "a people manager"}
        </a>
      </aside>
      <Prototype
        technologyPreview
        managerRecord={{
          isPeopleManager: manager,
          ...(manager ? { directReports: 6 } : {}),
        }}
      />
    </>
  );
}
