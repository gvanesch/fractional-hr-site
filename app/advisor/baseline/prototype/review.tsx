import {
  CONTACT_ROUTES,
  PAYROLL_STAGES,
  PAYROLL_PARTIES,
  MY_PAYROLL_PART,
  CONTRIBUTIONS,
  DEPENDENCIES,
  KNOWLEDGE,
  SYSTEMS,
  MANUAL,
  richEvidence,
} from "@/lib/baseline/prototype-enrichment";
import { BROAD_AREAS } from "@/lib/baseline/broad-prototype";
const labels = (codes: string[], options: string[][]) =>
  codes
    .map((code) => options.find((o) => o[0] === code)?.[1] ?? code)
    .join(", ");
export default function ContextReview({
  evidence: e,
}: {
  evidence: ReturnType<typeof richEvidence>;
}) {
  return (
    <>
      <section className="tb-process">
        <h2>How people contact you or your team</h2>
        {e.contact.receives !== "yes" ? (
          <p>
            {e.contact.receives === "no"
              ? "No employee or manager requests received"
              : "Not sure whether requests are received"}
          </p>
        ) : (
          <>
            {e.contact.routes?.map((r) => (
              <p key={r.code}>
                {labels([r.code], CONTACT_ROUTES)}: {r.shareOfRequests}% of
                requests
              </p>
            ))}
            <p>
              Requests recorded:{" "}
              {e.contact.recording === "unknown"
                ? "Not sure"
                : e.contact.recording}
              . Duplicate requests:{" "}
              {e.contact.duplicateRequests === "unknown"
                ? "Not sure"
                : e.contact.duplicateRequests}
              .
            </p>
            <p>
              Employee and manager routes:{" "}
              {e.contact.sameEmployeeManagerRoutes === "same"
                ? "Broadly the same"
                : e.contact.sameEmployeeManagerRoutes === "different"
                  ? "Different"
                  : "Not sure"}
              .
            </p>
            {e.contact.employeeRoutes && (
              <>
                <p>
                  Employee routes:{" "}
                  {labels(e.contact.employeeRoutes, CONTACT_ROUTES)}
                </p>
                <p>
                  Manager routes:{" "}
                  {labels(e.contact.managerRoutes ?? [], CONTACT_ROUTES)}
                </p>
              </>
            )}
          </>
        )}
      </section>
      {e.payroll && (
        <section className="tb-process">
          <h2>Payroll</h2>
          {e.payroll.involvement !== "yes" ? (
            <p>
              {e.payroll.involvement === "no"
                ? "Not personally involved in payroll"
                : "Payroll involvement not sure"}
            </p>
          ) : (
            <>
              {e.payroll.stages?.map((s) => (
                <p key={s.code}>
                  <strong>{labels([s.code], PAYROLL_STAGES)}</strong>
                  <br />
                  {labels([s.mine], MY_PAYROLL_PART)}. Others:{" "}
                  {labels(s.others, PAYROLL_PARTIES)}.
                </p>
              ))}
              <p>
                Cycle: {e.payroll.cycle?.replaceAll("_", " ")}. Personal payroll
                days:{" "}
                {e.payroll.daysUnknown
                  ? "Not sure"
                  : e.payroll.estimatedPersonalDays}
                .
              </p>
            </>
          )}
        </section>
      )}
      <section className="tb-process">
        <h2>Scope and working context</h2>
        <p>
          Support scope:{" "}
          {
            {
              one: "One brand / entity",
              several: "Several brands / entities",
              group: "Group / all team.blue",
              unknown: "Not sure",
            }[e.scope]
          }
        </p>
        {Object.entries(e.contributions)
          .filter(([, v]) => v.length)
          .map(([code, values]) => (
            <p key={code}>
              Contribution in {BROAD_AREAS.find((a) => a.code === code)?.label}:{" "}
              {labels(values, CONTRIBUTIONS)}
            </p>
          ))}
        {e.dependencies.length > 0 && (
          <p>Main dependencies: {labels(e.dependencies, DEPENDENCIES)}</p>
        )}
        {e.knowledge.length > 0 && (
          <p>Knowledge: {labels(e.knowledge, KNOWLEDGE)}</p>
        )}
        {e.knowledgeNote && <p>{e.knowledgeNote}</p>}
        {e.systems.length > 0 && <p>Systems: {labels(e.systems, SYSTEMS)}</p>}
        {e.otherSystems && <p>Other tools: {e.otherSystems}</p>}
        {e.manualWork.length > 0 && (
          <p>Extra manual work: {labels(e.manualWork, MANUAL)}</p>
        )}
        {e.manualNote && <p>{e.manualNote}</p>}
        {e.strengths && <p>Keep: {e.strengths}</p>}
        {e.missing && <p>Additional context: {e.missing}</p>}
      </section>
    </>
  );
}
