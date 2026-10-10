"use client";
import { useId } from "react";
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
  toggleOption,
  routeTotal,
  type RichDraft,
} from "@/lib/baseline/prototype-enrichment";
const YES = [
  ["yes", "Yes"],
  ["no", "No"],
  ["unknown", "Not sure"],
];
const HELP: Record<string, string> = {
  do: "You carry out this stage yourself. Others may also help.",
  check: "You review the work or give approval for it to proceed.",
  coordinate:
    "You organise information, chase progress or support the people doing it.",
  none: "You do not take part in this stage.",
  unknown: "You do not know enough to describe this confidently.",
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
  const help = HELP[value];
  return (
    <label className="tb-field">
      <span>{label}</span>
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
              {values.includes(code) && HELP[code] && (
                <small className="tb-activity-help">{HELP[code]}</small>
              )}
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
}: {
  label: string;
  value: string;
  change: (s: string) => void;
  help?: string;
}) {
  return (
    <label className="tb-field">
      <span>{label}</span>
      <textarea
        aria-label={label}
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
  areas,
}: {
  step: string;
  draft: RichDraft;
  change: (p: Partial<RichDraft>) => void;
  issues: string[];
  areas: { code: string; label: string }[];
}) {
  const bad = (key: string) => issues.includes(key);
  if (step === "contact")
    return (
      <>
        <p>
          Tell us how employees and managers ask you or your team for help with
          people, workplace or office matters. Use your own experience; an
          estimate is enough.
        </p>
        <Pick
          label="Do you or your team receive employee or manager requests?"
          value={d.receives}
          options={YES}
          invalid={bad("receives")}
          change={(receives) => change({ receives })}
        />
        {d.receives === "yes" && (
          <>
            <Checks
              label="Main contact routes"
              values={d.routes}
              options={CONTACT_ROUTES}
              max={5}
              invalid={bad("routes")}
              change={(routes) => change({ routes })}
            />
            <p>
              Choose up to five. If more routes are used, include the remaining
              routes under Other routes.
            </p>
            <div className="tb-total" aria-live="polite">
              Share of requests: {routeTotal(d)}%
              <small>
                Estimate requests received, rather than working time. Aim for
                100%.
              </small>
            </div>
            {d.routes.map((code) => (
              <label
                key={code}
                className={
                  "tb-field" + (bad("route_" + code) ? " tb-invalid" : "")
                }
              >
                <span>
                  Request share:{" "}
                  {CONTACT_ROUTES.find((r) => r[0] === code)?.[1]}
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
                      Number.isFinite(d.routeTime[code])
                        ? d.routeTime[code]
                        : ""
                    }
                    onChange={(e) =>
                      change({
                        routeTime: {
                          ...d.routeTime,
                          [code]:
                            e.target.value === ""
                              ? NaN
                              : Number(e.target.value),
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
        )}
      </>
    );
  if (step === "payroll")
    return (
      <>
        <p>
          You selected payroll, pay and benefits. These questions apply to
          payroll only.
        </p>
        <Pick
          label="Are you personally involved in payroll?"
          value={d.payroll}
          options={[
            ["yes", "Yes"],
            ["no", "No — pay or benefits work only"],
            ["unknown", "Not sure"],
          ]}
          invalid={bad("payroll")}
          change={(payroll) => change({ payroll })}
        />
        {d.payroll === "yes" && (
          <>
            <p>
              For each stage, describe your main part and who else does it.
              Shared involvement is expected. Choose Not sure where you do not
              know.
            </p>
            {PAYROLL_STAGES.map(([code, label], index) => {
              const a = d.payrollStages[code] ?? { mine: "", others: [] };
              const update = (p: Partial<typeof a>) =>
                change({
                  payrollStages: { ...d.payrollStages, [code]: { ...a, ...p } },
                });
              return (
                <details
                  open={index === 0 || bad("payroll_" + code)}
                  className={
                    "tb-process" + (bad("payroll_" + code) ? " tb-invalid" : "")
                  }
                  key={code}
                >
                  <summary>
                    {label}
                    {a.mine && a.others.length ? " · Answered" : ""}
                  </summary>
                  <Pick
                    label={"Your part: " + label}
                    value={a.mine}
                    options={MY_PAYROLL_PART}
                    invalid={bad("payroll_" + code) && !a.mine}
                    change={(mine) => update({ mine })}
                  />
                  <Checks
                    label={"Who else does this stage? " + label}
                    values={a.others}
                    options={PAYROLL_PARTIES}
                    exclusive={["none", "unknown"]}
                    invalid={bad("payroll_" + code) && !a.others.length}
                    change={(others) => update({ others })}
                  />
                </details>
              );
            })}
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
                Include preparation, checking and questions. Half a day can be
                entered as 0.5. If cycles vary too much to estimate, choose Not
                sure.
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
        Please answer the selection questions below. You can choose None or Not
        sure where appropriate. Written notes are optional. Avoid names or
        details of individual employee cases.
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
      <h2>Your main contribution</h2>
      <p>
        Select what applies within each work area. More than one can apply. This
        describes the work you do today. Please select at least one answer for
        each work area. Not sure is a valid answer.
      </p>
      <details
        className="tb-process"
        open={issues.some((i) => i.startsWith("contribution_"))}
      >
        <summary>Main contribution within work areas (required)</summary>
        {areas.map((a) => (
          <Checks
            key={a.code}
            label={"Contribution: " + a.label}
            invalid={bad("contribution_" + a.code)}
            values={d.contributions[a.code] ?? []}
            options={CONTRIBUTIONS}
            exclusive={["unknown"]}
            change={(values) =>
              change({
                contributions: { ...d.contributions, [a.code]: values },
              })
            }
          />
        ))}
      </details>
      <Checks
        label="Who do you mainly depend on to complete your work?"
        values={d.dependencies}
        options={DEPENDENCIES}
        max={5}
        invalid={bad("dependencies")}
        exclusive={["none", "unknown"]}
        change={(dependencies) => change({ dependencies })}
      />
      <details className="tb-process" open={bad("knowledge") || bad("systems")}>
        <summary>Systems and local or specialist knowledge (required)</summary>
        <Checks
          label="What knowledge do colleagues rely on you for?"
          invalid={bad("knowledge")}
          exclusive={["none", "unknown"]}
          values={d.knowledge}
          options={KNOWLEDGE}
          change={(knowledge) => change({ knowledge })}
        />
        <Text
          label="Any local or specialist knowledge to mention? (optional)"
          value={d.knowledgeNote}
          change={(knowledgeNote) => change({ knowledgeNote })}
          help="For example, a local process, language or business requirement. No personal employee information is needed."
        />
        <Checks
          label="Systems and tools you use regularly"
          invalid={bad("systems")}
          exclusive={["none", "unknown"]}
          values={d.systems}
          options={SYSTEMS}
          change={(systems) => change({ systems })}
        />
        <Text
          label="Other systems or tools (optional)"
          value={d.otherSystems}
          change={(otherSystems) => change({ otherSystems })}
        />
      </details>
      <Checks
        label="What creates extra manual work?"
        invalid={bad("manual")}
        values={d.manual}
        options={MANUAL}
        exclusive={["none", "unknown"]}
        change={(manual) => change({ manual })}
      />
      <Text
        label="One example of extra manual work (optional)"
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
    </>
  );
}
