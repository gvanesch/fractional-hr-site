import {
  CONTACT_ROUTES,
  PAYROLL_STAGES,
  PAYROLL_PARTIES,
  MY_PAYROLL_PART,
  WORK_NATURE,
  LOCAL_NEEDS,
  SYSTEMS,
  richEvidence,
} from "@/lib/baseline/prototype-enrichment";
import { BROAD_AREAS } from "@/lib/baseline/broad-prototype";
const labels = (codes: string[], options: string[][]) =>
  codes.map((c) => options.find((o) => o[0] === c)?.[1] ?? c).join(", ");
export default function ContextReview({
  evidence: e,
  focusedLocalContext = false,
}: {
  focusedLocalContext?: boolean;
  evidence: ReturnType<typeof richEvidence>;
}) {
  return (
    <>
      {Object.entries(e.workNature).map(([code, value]) => (
        <p key={code}>
          Type of work in {BROAD_AREAS.find((a) => a.code === code)?.label}:{" "}
          {labels([value], WORK_NATURE)}
        </p>
      ))}
      <section className="tb-process">
        <h2>How people contact you or your team</h2>
        {e.contact.routes.map((r) => (
          <p key={r.code}>
            {labels([r.code], CONTACT_ROUTES)}: {r.shareOfRequests}% of requests
          </p>
        ))}
        <p>
          Requests recorded:{" "}
          {labels(
            [e.contact.recording],
            [
              ["all", "All requests"],
              ["most", "Most requests"],
              ["some", "Some requests"],
              ["none", "None"],
              ["unknown", "Not sure"],
            ],
          )}
          . Duplicate requests:{" "}
          {labels(
            [e.contact.duplicateRequests],
            [
              ["often", "Often"],
              ["sometimes", "Sometimes"],
              ["rarely", "Rarely"],
              ["unknown", "Not sure"],
            ],
          )}
          .
        </p>
        {e.contact.recordingNote && (
          <p>Tracking and follow-up: {e.contact.recordingNote}</p>
        )}
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
      </section>
      {e.payroll && (
        <section className="tb-process">
          <h2>Payroll</h2>
          {e.payroll.involvement !== "yes" ? (
            <p>
              {e.payroll.involvement === "no"
                ? "No payroll-related work"
                : "Payroll involvement not sure"}
            </p>
          ) : (
            <>
              {e.payroll.stages?.map((s) => (
                <p key={s.code}>
                  <strong>{labels([s.code], PAYROLL_STAGES)}</strong>
                  <br />
                  {labels([s.mine ?? "unknown"], MY_PAYROLL_PART)}
                  {s.others.length > 0 && (
                    <>
                      . {s.mine === "none" ? "Handled by" : "Others involved"}:{" "}
                      {labels(s.others, PAYROLL_PARTIES)}
                    </>
                  )}
                  .
                </p>
              ))}
              <p>
                Payroll cycle:{" "}
                {labels(
                  [e.payroll.cycle ?? "unknown"],
                  [
                    ["weekly", "Weekly"],
                    ["fortnightly", "Every two weeks"],
                    ["four_weekly", "Every four weeks"],
                    ["monthly", "Monthly"],
                    ["varies", "Several cycles / it varies"],
                    ["other", "Other"],
                    ["unknown", "Not sure"],
                  ],
                )}
                . Your days per cycle:{" "}
                {e.payroll.daysUnknown
                  ? "Not sure"
                  : e.payroll.estimatedPersonalDays}
                .
              </p>
              {e.payroll.otherPayroll && (
                <p>Additional payroll work: {e.payroll.otherPayroll}</p>
              )}
            </>
          )}
        </section>
      )}
      <section className="tb-process">
        <h2>A few final questions</h2>
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
        {!focusedLocalContext && (
          <p>Local requirements: {labels(e.localNeeds, LOCAL_NEEDS)}</p>
        )}
        {e.localNote && (
          <p>
            {focusedLocalContext
              ? "Work needing local knowledge or presence: "
              : ""}
            {e.localNote}
          </p>
        )}
        {e.systems.length > 0 && <p>Systems: {labels(e.systems, SYSTEMS)}</p>}
        {e.otherSystems && <p>Other tools: {e.otherSystems}</p>}
        {e.manualNote && <p>Extra manual effort: {e.manualNote}</p>}
        {e.strengths && <p>Keep: {e.strengths}</p>}
        {e.missing && <p>Additional context: {e.missing}</p>}
      </section>
    </>
  );
}
