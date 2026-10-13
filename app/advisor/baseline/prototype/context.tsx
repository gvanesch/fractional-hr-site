"use client";
import Info from "./info";
import { useId } from "react";
import {
  CONTACT_ROUTES,
  PAYROLL_STAGES,
  PAYROLL_PARTIES,
  MY_PAYROLL_PART,
  LOCAL_NEEDS,
  SYSTEMS,
  toggleOption,
  routeTotal,
  type RichDraft,
} from "@/lib/baseline/prototype-enrichment";
const QUESTION_HELP: Record<string, string> = {
  "Do you manage people who also report to another manager?":
    "This means someone in your own team has responsibilities agreed with two managers. Think about formal reporting arrangements.",
  "Do you regularly support one business or more than one?":
    "Think about the businesses or brands you regularly support. Include work you do for another business as part of your usual role.",
  "Are these requests recorded so others can see their status?":
    "A shared record lets colleagues see a request, who is handling it, and whether it is complete. Examples include a ticket system, shared inbox or shared tracker.",
  "Do employees and managers generally use the same routes?":
    "Think about how employees and managers contact you or your team. Compare the main routes used by each group.",
};
const HELP: Record<string, string> = {
  do: "You carry out this stage yourself. Others may also help.",
  check: "You review the work or give approval for it to proceed.",
  coordinate:
    "You organise information, follow up on progress or support the people doing it.",
  none: "You do not take part in this payroll stage. Tell us who handles it, or choose Not sure.",
  unknown: "You do not know enough to describe this confidently.",
  routine:
    "Preparing documents, maintaining information or coordinating an established process.",
  advisory:
    "Giving advice, managing complex matters or helping leaders make people decisions.",
  mixed:
    "Both types form a meaningful part of your work; do not try to split them precisely.",
  admin:
    "You prepare information, update records or carry out an established process.",
  advice: "You give guidance or help resolve an employee matter.",
  improvement: "You create or change a process, system or way of working.",
  coordination: "You organise people or activities, or lead delivery of work.",
};
export function Pick({
  label,
  value,
  options,
  change,
  invalid = false,
}: {
  label: string;
  value: string;
  options: string[][];
  change: (v: string) => void;
  invalid?: boolean;
}) {
  const id = useId();
  const help =
    value === "none" && !label.startsWith("Your part:")
      ? undefined
      : HELP[value];
  return (
    <label className="tb-field">
      <span className="tb-question-label">
        <span>{label}</span>
        {QUESTION_HELP[label] && (
          <Info label={label}>{QUESTION_HELP[label]}</Info>
        )}
      </span>
      <select
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={help ? id : undefined}
        value={value}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">Choose an answer</option>
        {options.map(([code, text]) => (
          <option key={code} value={code}>
            {text}
          </option>
        ))}
      </select>
      {help && (
        <small id={id} className="tb-definition">
          {help}
        </small>
      )}
    </label>
  );
}
export function Checks({
  label,
  values,
  options,
  change,
  max = Infinity,
  exclusive = [],
  invalid = false,
}: {
  label: string;
  values: string[];
  options: string[][];
  change: (v: string[]) => void;
  max?: number;
  exclusive?: string[];
  invalid?: boolean;
}) {
  return (
    <fieldset className={invalid ? "tb-process tb-invalid" : "tb-process"}>
      <legend>
        {label}
        {Number.isFinite(max) ? ` (${values.length}/${max})` : ""}
      </legend>
      <div className="tb-options">
        {options.map(([code, text]) => (
          <label key={code}>
            <input
              aria-label={label + ": " + text}
              type="checkbox"
              checked={values.includes(code)}
              disabled={
                !values.includes(code) &&
                values.filter((c) => !exclusive.includes(c)).length >= max &&
                !exclusive.includes(code)
              }
              onChange={() =>
                change(toggleOption(values, code, max, exclusive))
              }
            />
            <span>
              {text}
              {values.includes(code) &&
                ["admin", "advice", "improvement", "coordination"].includes(
                  code,
                ) && <small className="tb-activity-help">{HELP[code]}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Text({
  label,
  value,
  change,
  help,
  invalid = false,
}: {
  label: string;
  value: string;
  change: (s: string) => void;
  help?: string;
  invalid?: boolean;
}) {
  return (
    <label className="tb-field">
      <span>{label}</span>
      <textarea
        aria-label={label}
        aria-invalid={invalid}
        maxLength={1000}
        value={value}
        onChange={(e) => change(e.target.value)}
      />
      {help && <small>{help}</small>}
    </label>
  );
}
export default function Context({
  step,
  draft: d,
  change,
  issues,
}: {
  step: string;
  draft: RichDraft;
  change: (p: Partial<RichDraft>) => void;
  issues: string[];
}) {
  const bad = (key: string) => issues.includes(key);
  if (step === "contact")
    return (
      <>
        <p>
          Tell us how employees and managers ask you or your team for help with
          people, workplace or office matters. An estimate is enough.
        </p>
        <Checks
          label="Main contact routes"
          values={d.routes}
          options={CONTACT_ROUTES}
          max={5}
          invalid={bad("routes")}
          change={(routes) => change({ routes })}
        />
        <p>
          Choose up to five. Include any remaining routes under Other routes.
        </p>
        <div className="tb-total" aria-live="polite">
          Share of requests: {routeTotal(d)}%
          <small>
            Estimate the share of requests received, rather than working time.
            Aim for 100%.
          </small>
        </div>
        {d.routes.map((code) => (
          <label
            key={code}
            className={"tb-field" + (bad("route_" + code) ? " tb-invalid" : "")}
          >
            <span>
              Request share: {CONTACT_ROUTES.find((r) => r[0] === code)?.[1]}
            </span>
            <div className="tb-percentage">
              <input
                aria-label={
                  "Request share: " +
                  CONTACT_ROUTES.find((r) => r[0] === code)?.[1]
                }
                aria-invalid={bad("route_" + code)}
                type="number"
                min={0}
                max={100}
                step="any"
                inputMode="decimal"
                value={
                  Number.isFinite(d.routeTime[code]) ? d.routeTime[code] : ""
                }
                onChange={(e) =>
                  change({
                    routeTime: {
                      ...d.routeTime,
                      [code]:
                        e.target.value === "" ? NaN : Number(e.target.value),
                    },
                  })
                }
              />
              <span>%</span>
            </div>
          </label>
        ))}
        <Pick
          label="Are these requests recorded so others can see their status?"
          value={d.recording}
          options={[
            ["all", "All"],
            ["most", "Most"],
            ["some", "Some"],
            ["none", "None"],
            ["unknown", "Not sure"],
          ]}
          invalid={bad("recording")}
          change={(recording) => change({ recording })}
        />
        {["all", "most", "some"].includes(d.recording) && (
          <Text
            label="How are requests tracked and followed up?"
            value={d.recordingNote}
            invalid={bad("recordingNote")}
            change={(recordingNote) => change({ recordingNote })}
            help="For example: We record requests in Jira. The team can see who is handling each request. We aim to reply within two working days. Tell us which system or process you use. Explain how people with shared access know who is handling a request. Include any agreed response times, also called service level agreements."
          />
        )}
        <Pick
          label="How often does the same request reach more than one person or arrive through more than one route?"
          value={d.duplicates}
          options={[
            ["often", "Often"],
            ["sometimes", "Sometimes"],
            ["rarely", "Rarely"],
            ["unknown", "Not sure"],
          ]}
          invalid={bad("duplicates")}
          change={(duplicates) => change({ duplicates })}
        />
        <Pick
          label="Do employees and managers generally use the same routes?"
          value={d.sameRoutes}
          options={[
            ["same", "Yes, broadly the same"],
            ["different", "No, different routes"],
            ["unknown", "Not sure"],
          ]}
          invalid={bad("sameRoutes")}
          change={(sameRoutes) => change({ sameRoutes })}
        />
        {d.sameRoutes === "different" && (
          <>
            <Checks
              label="Main employee routes"
              values={d.employeeRoutes}
              options={CONTACT_ROUTES}
              max={5}
              invalid={bad("employeeRoutes")}
              change={(employeeRoutes) => change({ employeeRoutes })}
            />
            <Checks
              label="Main manager routes"
              values={d.managerRoutes}
              options={CONTACT_ROUTES}
              max={5}
              invalid={bad("managerRoutes")}
              change={(managerRoutes) => change({ managerRoutes })}
            />
            <p>No further percentage estimates are needed.</p>
          </>
        )}
      </>
    );
  if (step === "payroll")
    return (
      <>
        <p>
          These questions cover preparing or checking information used to pay
          employees, and answering payroll questions.
        </p>
        <Pick
          label="Do you do any payroll-related work?"
          value={d.payroll}
          options={[
            ["yes", "Yes"],
            ["no", "No"],
            ["unknown", "Not sure"],
          ]}
          invalid={bad("payroll")}
          change={(payroll) => change({ payroll })}
        />
        {d.payroll === "yes" && (
          <>
            <p>
              Choose your part in each area. If you are not involved, tell us
              who handles it, or choose Not sure.
            </p>
            {PAYROLL_STAGES.map(([code, label]) => {
              const a = d.payrollStages[code] ?? { mine: "", others: [] };
              const update = (p: Partial<typeof a>) =>
                change({
                  payrollStages: { ...d.payrollStages, [code]: { ...a, ...p } },
                });
              const parties =
                a.mine === "none"
                  ? PAYROLL_PARTIES.filter((o) => o[0] !== "none")
                  : PAYROLL_PARTIES;
              const actor = (
                <Checks
                  label={
                    (a.mine === "none"
                      ? "Who handles this work? "
                      : "Who else helps with this work? ") + label
                  }
                  values={a.others}
                  options={parties}
                  exclusive={["none", "unknown"]}
                  invalid={bad("payroll_" + code) && a.mine === "none"}
                  change={(others) => update({ others })}
                />
              );
              return (
                <section
                  className={
                    "tb-process tb-payroll-stage" +
                    (bad("payroll_" + code) ? " tb-invalid" : "")
                  }
                  key={code}
                >
                  <h2>{label}</h2>
                  <Pick
                    label={"Your part: " + label}
                    value={a.mine}
                    options={MY_PAYROLL_PART}
                    invalid={bad("payroll_" + code) && !a.mine}
                    change={(mine) =>
                      update({
                        mine,
                        others:
                          mine === "none"
                            ? a.others.filter((c) => c !== "none")
                            : a.others,
                      })
                    }
                  />
                  {a.mine === "none" ? (
                    actor
                  ) : a.mine && a.mine !== "unknown" ? (
                    <details>
                      <summary>Others involved (optional)</summary>
                      {actor}
                    </details>
                  ) : null}
                </section>
              );
            })}
            <Text
              label="Any other payroll work or important responsibilities? (optional)"
              value={d.otherPayroll}
              change={(otherPayroll) => change({ otherPayroll })}
              help="Mention any other work you do, or how the payroll partner and Finance are involved. A short answer is enough."
            />
            <Pick
              label="How often does the payroll cycle you support run?"
              value={d.cycle}
              options={[
                ["weekly", "Weekly"],
                ["fortnightly", "Every two weeks"],
                ["four_weekly", "Every four weeks"],
                ["monthly", "Monthly"],
                ["varies", "Several cycles / it varies"],
                ["other", "Other"],
                ["unknown", "Not sure"],
              ]}
              invalid={bad("cycle")}
              change={(cycle) => change({ cycle })}
            />
            <label className={"tb-field" + (bad("days") ? " tb-invalid" : "")}>
              <span>
                About how many days do you personally spend on payroll in a
                typical cycle?
              </span>
              <input
                aria-label="Personal payroll days per cycle"
                aria-invalid={bad("days")}
                type="number"
                min={0}
                max={31}
                step="any"
                disabled={d.daysUnknown}
                value={d.days ?? ""}
                onChange={(e) =>
                  change({
                    days: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <small>
                Include preparation, checks and questions. Enter 0.5 for half a
                day, or choose Not sure.
              </small>
            </label>
            <label className="tb-check">
              <input
                type="checkbox"
                checked={d.daysUnknown}
                onChange={(e) => change({ daysUnknown: e.target.checked })}
              />
              Not sure about payroll days
            </label>
          </>
        )}
      </>
    );
  return (
    <>
      <p>
        Two short questions help us understand the reach of your work and any
        local requirements. Additional notes are optional. Do not include names
        or details of individual employee cases.
      </p>
      <Pick
        label="Do you regularly support one business or more than one?"
        value={d.scope}
        options={[
          ["one", "One brand / entity"],
          ["several", "Several brands / entities"],
          ["group", "Group / all team.blue"],
          ["unknown", "Not sure"],
        ]}
        invalid={bad("scope")}
        change={(scope) => change({ scope })}
      />
      <Checks
        label="Does any of your work need the following?"
        values={d.localNeeds}
        options={LOCAL_NEEDS}
        exclusive={["none", "unknown"]}
        invalid={bad("localNeeds")}
        change={(localNeeds) => change({ localNeeds })}
      />
      <Text
        label="Anything important about these local requirements? (optional)"
        value={d.localNote}
        change={(localNote) => change({ localNote })}
      />
      <section className="tb-process">
        <h3>Systems and tools</h3>
        <p>
          Using a system for everyday work is different from administering it.
          System administration means configuring, maintaining or managing it
          for other users.
        </p>
        <Checks
          label="Systems and tools you use regularly"
          values={d.systems}
          options={SYSTEMS}
          invalid={bad("systems")}
          exclusive={["none", "unknown"]}
          change={(systems) => change({ systems })}
        />
        <Text
          label={
            d.systems.includes("other")
              ? "Other systems or tools"
              : "Other systems or tools (optional)"
          }
          help="Enter one system per line. If you support or administer these systems, the technology section asks about each one separately."
          invalid={bad("otherSystems")}
          value={d.otherSystems}
          change={(otherSystems) => change({ otherSystems })}
        />
      </section>
      <section className="tb-process">
        <h3>What could work better, and what should we keep?</h3>
        <Text
          label="Where could a simpler process or better tools save you time? (optional)"
          value={d.manualNote}
          change={(manualNote) => change({ manualNote })}
        />
        <Text
          label="What works well and should we keep? (optional)"
          value={d.strengths}
          change={(strengths) => change({ strengths })}
        />
        <Text
          label="Anything important about your work we have missed? (optional)"
          value={d.missing}
          change={(missing) => change({ missing })}
        />
      </section>
    </>
  );
}
