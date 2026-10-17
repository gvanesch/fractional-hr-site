import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { baselineEnv } from "@/lib/baseline/server";
import Prototype from "../prototype/prototype";
import {
  initialCollection,
  DEPTH_COLLECTION_VERSION,
} from "@/lib/baseline/collection";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "team.blue | Detailed questionnaire preview",
  robots: { index: false, follow: false },
};
export default async function DepthPreview({
  searchParams,
}: {
  searchParams: Promise<{ manager?: string }>;
}) {
  try {
    baselineEnv();
  } catch {
    notFound();
  }
  if (!(await requireAdvisorUser())) redirect("/advisor/login");
  const manager = (await searchParams).manager === "yes";
  return (
    <>
      <aside className="tb-shell">
        <p>
          Questionnaire preview — answers are not saved and no email is sent.
        </p>
        <Link href={manager ? "?manager=no" : "?manager=yes"}>
          Preview {manager ? "a non-manager" : "a people manager"}
        </Link>
      </aside>
      <Prototype
        technologyPreview
        managerRecord={{
          isPeopleManager: manager,
          ...(manager ? { directReports: 3 } : {}),
        }}
        savedCollection={{
          draft: initialCollection(DEPTH_COLLECTION_VERSION),
          progress: 0,
          status: "not_started",
          campaign: {
            privacy:
              "This preview does not save a campaign response or send email.",
            closed: false,
            copyPreview: true,
          },
        }}
      />
    </>
  );
}
