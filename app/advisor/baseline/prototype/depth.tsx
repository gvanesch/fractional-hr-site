"use client";
import { useEffect, useRef } from "react";
import { Pick } from "./context";
import { toggleOption } from "@/lib/baseline/prototype-enrichment";
import { BROAD_AREAS } from "@/lib/baseline/broad-prototype";
import { MANAGEMENT_AREA } from "@/lib/baseline/management-prototype";
import {
  PROJECT_COUNTRIES,
  COUNTRY_OPTIONS,
  LOCAL_REQUIREMENTS,
  WORK_PARTIES,
  OWNERSHIP,
  TASKS,
  MONTHS,
  CAPACITY,
  NUMBER_BASIS,
  AUTONOMY,
  emptyWorkDetail,
  coverageCountries,
  sumShares,
  depthIssues,
  type DepthDraft,
  type WorkDetail,
} from "@/lib/baseline/depth";
const known = (v: string) => ["records", "estimate"].includes(v);
function Checks({
  label,
  values,
  options,
  change,
  invalid = false,
}: {
  label: string;
  values: string[];
  options: string[][];
  change: (v: string[]) => void;
  invalid?: boolean;
}) {
  return (
    <fieldset className={"tb-process" + (invalid ? " tb-invalid" : "")}>
      <legend>{label}</legend>
      <div className="tb-options">
        {options.map(([code, text]) => (
          <label key={code}>
            <input
              type="checkbox"
              aria-label={label + ": " + text}
              checked={values.includes(code)}
              onChange={() =>
                change(
                  toggleOption(values, code, Infinity, ["none", "unknown"]),
                )
              }
            />
            <span>{text}</span>
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
  invalid = false,
  help = "",
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  invalid?: boolean;
  help?: string;
}) {
  return (
    <label className="tb-field">
      <span>{label}</span>
      <textarea
        aria-label={label}
        aria-invalid={invalid}
        value={value}
        maxLength={2000}
        onChange={(e) => change(e.target.value)}
      />
      {help && <small>{help}</small>}
    </label>
  );
}
function NumberField({
  label,
  value,
  change,
  invalid = false,
  max = 100,
}: {
  label: string;
  value: number | null | undefined;
  change: (v: number | null) => void;
  invalid?: boolean;
  max?: number;
}) {
  return (
    <label className="tb-field">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step="any"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid}
        value={typeof value === "number" && Number.isFinite(value) ? value : ""}
        onChange={(e) =>
          change(e.target.value === "" ? null : Number(e.target.value))
        }
      />
    </label>
  );
}
function AreaPanel({
  label,
  invalid,
  children,
}: {
  label: string;
  invalid: boolean;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (invalid && panel.current) panel.current.open = true;
  }, [invalid]);
  return (
    <details
      ref={panel}
      className={"tb-process" + (invalid ? " tb-invalid" : "")}
      open={invalid || undefined}
    >
      <summary>{label}</summary>
      {children}
    </details>
  );
}
export default function Depth({
  draft: d,
  change,
  selected,
  step,
  issues,
}: {
  draft: DepthDraft;
  change: (p: Partial<DepthDraft>) => void;
  selected: string[];
  step: string;
  issues: string[];
}) {
  const bad = (k: string) => issues.includes(k);
  const text = (key: keyof DepthDraft, label: string, help = "") => (
    <Text
      label={label}
      help={help}
      value={String(d[key] ?? "")}
      invalid={bad(key)}
      change={(v) => change({ [key]: v })}
    />
  );
  const pick = (key: keyof DepthDraft, label: string, options: string[][]) => (
    <Pick
      label={label}
      value={String(d[key] ?? "")}
      invalid={bad(key)}
      options={options}
      change={(v) => change({ [key]: v })}
    />
  );
  const num = (key: keyof DepthDraft, label: string, max = 168) => (
    <NumberField
      label={label}
      max={max}
      value={d[key] as number | null}
      invalid={bad(key)}
      change={(v) => change({ [key]: v })}
    />
  );
  if (step === "coverage")
    return (
      <>
        <p>
          Keep where you work separate from the countries and businesses you
          support. Include contractors and services delivered from outside the
          core countries.
        </p>
        {pick(
          "basedCountry",
          "Which country are you normally based in for work?",
          [
            ...PROJECT_COUNTRIES.map(([c, l]) => [c, l]),
            ["other", "Other country"],
            ["unknown", "Not sure"],
          ],
        )}
        {d.basedCountry === "other" &&
          text("basedOther", "Your work-base country")}
        <Checks
          label="Countries you regularly support"
          values={d.countries}
          options={COUNTRY_OPTIONS}
          invalid={bad("countries")}
          change={(countries) => change({ countries })}
        />
        {d.countries.includes("other") &&
          text(
            "otherCountries",
            "Other countries you support",
            "Name each country. If more than one, put one country per line.",
          )}
        {!d.countries.includes("unknown") && d.countries.length > 0 && (
          <>
            <h2>Time supporting each country</h2>
            <p>
              This is another view of your total working time, separate from the
              work-area split. Count each hour once. Use Group-wide for
              genuinely shared work rather than repeating it under every
              country.
            </p>
            <label className="tb-check">
              <input
                type="checkbox"
                checked={d.countryTimeUnknown}
                onChange={(e) =>
                  change({ countryTimeUnknown: e.target.checked })
                }
              />
              I cannot reasonably estimate the country split
            </label>
            {!d.countryTimeUnknown && (
              <>
                <div className="tb-total" aria-live="polite">
                  Country total:{" "}
                  {sumShares(
                    coverageCountries(d).map((c) => c.code),
                    d.countryTime,
                  )}
                  %<small>Aim for 100% of total working time.</small>
                </div>
                {coverageCountries(d).map(({ code, label }) => (
                  <NumberField
                    key={code}
                    label={"Country time: " + label + " (%)"}
                    invalid={bad("countryTime_" + code)}
                    value={d.countryTime[code]}
                    change={(v) =>
                      change({ countryTime: { ...d.countryTime, [code]: v } })
                    }
                  />
                ))}
              </>
            )}
          </>
        )}
        {text(
          "businesses",
          "Which brands, businesses or legal entities do you regularly support?",
          "List the names. Write Group-wide if applicable, or Not sure. This is service coverage, not just your employing entity.",
        )}
        {pick(
          "populationBasis",
          "Basis for the employee population you regularly support",
          NUMBER_BASIS,
        )}
        {known(d.populationBasis) &&
          num(
            "supportedEmployees",
            "Approximate employee population you support",
            1e9,
          )}
        {text(
          "languages",
          "Which languages can you use to deliver this work, and at what working level?",
          "For example English — professional; Finnish — everyday employee support. Include restrictions or write Not sure.",
        )}
      </>
    );
  if (step === "work_detail")
    return (
      <>
        <p>
          Open each selected work area. Estimate the split within that area,
          then describe ownership, local requirements, demand and hand-offs. You
          can choose Not known where records or a sensible estimate are
          unavailable.
        </p>
        {selected.map((area) => {
          const w = d.work[area] ?? emptyWorkDetail(),
            p = area + "_",
            label =
              [...BROAD_AREAS, MANAGEMENT_AREA].find((a) => a.code === area)
                ?.label ?? area;
          const update = (patch: Partial<WorkDetail>) =>
            change({ work: { ...d.work, [area]: { ...w, ...patch } } });
          const txt = (key: keyof WorkDetail, title: string, help = "") => (
            <Text
              label={label + ": " + title}
              help={help}
              value={String(w[key] ?? "")}
              invalid={bad(p + key)}
              change={(v) => update({ [key]: v })}
            />
          );
          const pk = (
            key: keyof WorkDetail,
            title: string,
            options: string[][],
          ) => (
            <Pick
              label={label + ": " + title}
              value={String(w[key] ?? "")}
              invalid={bad(p + key)}
              options={options}
              change={(v) => update({ [key]: v })}
            />
          );
          const n = (key: keyof WorkDetail, title: string, max = 100) => (
            <NumberField
              label={label + ": " + title}
              max={max}
              value={w[key] as number | null}
              invalid={bad(p + key)}
              change={(v) => update({ [key]: v })}
            />
          );
          const checks = (
            key: "local" | "receives" | "passes",
            title: string,
            options: string[][],
          ) => (
            <Checks
              label={label + ": " + title}
              values={w[key]}
              options={options}
              invalid={bad(p + key)}
              change={(v) => update({ [key]: v })}
            />
          );
          return (
            <AreaPanel
              key={area}
              label={label}
              invalid={issues.some((i) => i.startsWith(p))}
            >
              {TASKS[area] && (
                <>
                  <Checks
                    label={label + ": Work you actually do"}
                    values={w.tasks}
                    options={[...TASKS[area], ["unknown", "Not sure"]]}
                    invalid={bad(p + "tasks")}
                    change={(tasks) => update({ tasks })}
                  />
                  {!w.tasks.includes("unknown") && w.tasks.length > 0 && (
                    <>
                      <label className="tb-check">
                        <input
                          type="checkbox"
                          checked={w.taskTimeUnknown}
                          onChange={(e) =>
                            update({ taskTimeUnknown: e.target.checked })
                          }
                        />
                        I cannot reasonably estimate this activity split
                      </label>
                      {!w.taskTimeUnknown && (
                        <>
                          <div className="tb-total" aria-live="polite">
                            {label} activity total:{" "}
                            {sumShares(w.tasks, w.taskTime)}%
                            <small>
                              100% of this work area, not your whole working
                              time.
                            </small>
                          </div>
                          {w.tasks.map((code) => (
                            <NumberField
                              key={code}
                              label={
                                label +
                                " activity time: " +
                                (TASKS[area].find((o) => o[0] === code)?.[1] ??
                                  code) +
                                " (%)"
                              }
                              invalid={bad(p + "taskTime_" + code)}
                              value={w.taskTime[code]}
                              change={(v) =>
                                update({
                                  taskTime: { ...w.taskTime, [code]: v },
                                })
                              }
                            />
                          ))}
                        </>
                      )}
                    </>
                  )}
                  {w.tasks.includes("other") &&
                    txt("taskNote", "Describe the other work")}
                </>
              )}
              {checks(
                "local",
                "Local delivery requirements",
                LOCAL_REQUIREMENTS,
              )}
              {w.local.some((c) => !["none", "unknown"].includes(c)) &&
                txt(
                  "localNote",
                  "Which countries, languages or sites need this, and why?",
                  "Describe the work that must stay local, including required office cover or service hours. Local knowledge does not always require physical presence.",
                )}
              {pk("ownership", "Your main accountability", OWNERSHIP)}
              {txt(
                "ownerTeam",
                "Who is accountable for the whole process / service?",
                "Give a team or role, not a personal name. If you own it, say My role. If not known, write Not sure.",
              )}
              {checks(
                "receives",
                "Work or information received from",
                WORK_PARTIES,
              )}
              {checks("passes", "Work or approval passed to", WORK_PARTIES)}
              {txt(
                "handoffNote",
                "Hand-off details or recurring delays (optional)",
                "Name the step, team or system and where work waits, duplicates or returns for correction.",
              )}
              {pk(
                "volumeBasis",
                "Basis for your personal work volume",
                NUMBER_BASIS,
              )}
              {known(w.volumeBasis) && (
                <>
                  {n("volume", "Typical personal volume", 1e9)}
                  {pk("volumePeriod", "Volume period", [
                    ["week", "Per typical week"],
                    ["month", "Per typical month"],
                    ["year", "Per year"],
                  ])}
                </>
              )}
              {(known(w.volumeBasis) ||
                known(w.handlingBasis) ||
                known(w.reworkBasis)) &&
                txt(
                  "volumeUnit",
                  "What is being counted?",
                  "For example joiners, leavers, contracts, cases, tickets or payroll employee records. Count your own work, not the whole team's workload.",
                )}
              {pk("handlingBasis", "Basis for time per item", NUMBER_BASIS)}
              {known(w.handlingBasis) &&
                n("handlingMinutes", "Average active minutes per item", 100000)}
              {pk(
                "reworkBasis",
                "Basis for rework / corrections",
                NUMBER_BASIS,
              )}
              {known(w.reworkBasis) &&
                n(
                  "reworkPercent",
                  "Share of items needing rework / correction (%)",
                )}
              {pk(
                "transferable",
                "Could some of this work be delivered from another country?",
                [
                  ["yes", "Yes, subject to validation"],
                  ["part", "Part of it, with conditions"],
                  ["no", "No, it needs local delivery"],
                  ["unknown", "Not sure"],
                ],
              )}
              {["yes", "part"].includes(w.transferable) && (
                <>
                  {n(
                    "transferPercent",
                    "Estimated share that could be delivered elsewhere (%)",
                  )}
                  {txt(
                    "transferNote",
                    "Which work could move, and what would be needed?",
                    "Include skills, permissions, language, local approvals, systems, documentation and hand-over effort. This is a proposal, not confirmed spare capacity.",
                  )}
                </>
              )}
            </AreaPanel>
          );
        })}
      </>
    );
  if (step === "role_capacity")
    return (
      <>
        <h2>Your responsibility and judgement</h2>
        {pick(
          "autonomy",
          "Which description best matches your usual decision-making?",
          AUTONOMY,
        )}
        {pick("complexity", "What kind of problems do you usually resolve?", [
          ["standard", "Mostly standard tasks with known answers"],
          ["varied", "Varied situations within established practice"],
          ["complex", "Complex exceptions requiring specialist judgement"],
          [
            "novel",
            "New / cross-business problems without established answers",
          ],
          ["unknown", "Not sure"],
        ])}
        {pick(
          "impact",
          "What is the normal reach of decisions you are accountable for?",
          [
            ["individual", "Individual requests or cases"],
            ["team", "A team / local service"],
            ["country", "A country or business"],
            ["regional", "Several countries / a region"],
            ["group", "Group-wide services or policy"],
            ["unknown", "Not sure"],
          ],
        )}
        {text(
          "decisionExample",
          "Give one example of a decision you make independently",
          "Explain what you decide, the boundaries, who is affected and what would happen if it went wrong. Use role or team names; no employee case details. If you do not make independent decisions, explain the review you need.",
        )}
        {text(
          "escalation",
          "Which decisions need approval, and who approves them?",
          "For example employment-law exceptions, pay, budget, policy changes, system access or service priorities. Name the approving role or team.",
        )}
        <h2>Demand and available time</h2>
        <p>
          Use a typical week in your current contracted working pattern.
          Available time means uncommitted time after current work, required
          cover and other commitments. It is not the same as time that might be
          released by redesign. Estimates will be validated with your manager.
        </p>
        {pick(
          "capacity",
          "How does current demand compare with your available time?",
          CAPACITY,
        )}
        {pick(
          "hoursBasis",
          "Basis for your contracted weekly hours",
          NUMBER_BASIS,
        )}
        {known(d.hoursBasis) &&
          num("weeklyHours", "Your contracted hours per week")}
        {num(
          "overtimeHours",
          "Typical additional hours worked per week (optional)",
        )}
        {pick(
          "availableBasis",
          "Basis for uncommitted time available now",
          NUMBER_BASIS,
        )}
        {known(d.availableBasis) &&
          num("availableHours", "Uncommitted hours in a typical week")}
        {num(
          "fixedOnsiteHours",
          "Hours per week committed to physical site / reception cover (optional)",
        )}
        {text(
          "unmetWork",
          "Work delayed, unmet demand or backlog (optional)",
          "Name the work, approximate age / volume and service impact. Say when the pressure occurs.",
        )}
        {pick(
          "backup",
          "Is trained cover available for your main responsibilities?",
          [
            ["full", "Yes, for all main work"],
            ["partial", "For some work only"],
            ["none", "No trained cover"],
            ["unknown", "Not sure"],
          ],
        )}
        <h2>Workload peaks</h2>
        {pick(
          "peakPattern",
          "Are there predictable peaks or major event-driven demands?",
          [
            ["none", "No significant peaks"],
            ["seasonal", "Predictable seasonal / annual peaks"],
            ["events", "Event-driven peaks / projects"],
            ["unknown", "Not sure"],
          ],
        )}
        {["seasonal", "events"].includes(d.peakPattern) && (
          <>
            <Checks
              label="Peak months"
              options={MONTHS}
              values={d.peakMonths}
              invalid={bad("peakMonths")}
              change={(peakMonths) => change({ peakMonths })}
            />
            {text(
              "peakDescription",
              "What drives the peaks and how long do they last?",
              "Include annual cycles, deadlines, office moves or implementations, duration in weeks and what other work is deferred.",
            )}
            {pick(
              "peakBasis",
              "Basis for additional peak effort",
              NUMBER_BASIS,
            )}
            {known(d.peakBasis) &&
              num(
                "peakExtraHours",
                "Additional work hours required per peak week",
              )}
          </>
        )}
        {text(
          "improvements",
          "Where could work be simplified, automated or shared? (optional)",
          "Describe the specific work, recurring friction and any tools, dependencies or safeguards needed. Do not assume all of the time would be saved.",
        )}
        <h2>Existing service measures and provider costs</h2>
        <p>
          Only report figures you know. Do not guess or enter personal salary
          details. These figures describe your stated scope and will be checked
          against source records.
        </p>
        {pick(
          "serviceMetrics",
          "Do you have agreed service targets or measured outcomes?",
          [
            ["yes", "Yes"],
            ["no", "No"],
            ["unknown", "Not sure"],
          ],
        )}
        {d.serviceMetrics === "yes" && (
          <>
            {text("metricName", "Which service, measure and unit?")}
            {text(
              "metricTarget",
              "What is the agreed target?",
              "If there is no formal target, say No formal target.",
            )}
            {text(
              "metricActual",
              "What was the latest actual result?",
              "Write Not available if the result is not recorded.",
            )}
            {text("metricPeriod", "Which reporting period does it cover?")}
            {text(
              "metricSource",
              "Which system / report or role can verify the figure?",
            )}
          </>
        )}
        {pick(
          "costKnowledge",
          "Do you know a recurring external provider cost for work you support?",
          [
            ["known", "Yes, I have a figure and source"],
            ["unknown", "Not known"],
            ["na", "Not applicable"],
          ],
        )}
        {d.costKnowledge === "known" && (
          <>
            {num("providerCost", "External provider cost amount", 1e12)}
            {text("costCurrency", "Cost currency (for example EUR)")}
            {text(
              "costPeriod",
              "Cost period and service scope",
              "For example monthly payroll provider fee for 200 employees in Finland. Do not report a per-item fee as the total cost.",
            )}
            {text(
              "costSource",
              "Cost source / validating team",
              "Give a report, contract or responsible team. Do not attach contracts or personal pay details.",
            )}
          </>
        )}
      </>
    );
  return null;
}
export function DepthReview({
  draft,
  selected,
}: {
  draft: DepthDraft;
  selected: string[];
}) {
  return (
    <section className="tb-process">
      <h2>Detailed work and delivery evidence</h2>
      <p>
        Work base:{" "}
        {draft.basedCountry === "other"
          ? draft.basedOther
          : (PROJECT_COUNTRIES.find((c) => c[0] === draft.basedCountry)?.[1] ??
            draft.basedCountry)}
      </p>
      <p>
        Countries supported:{" "}
        {draft.countries
          .map((c) => COUNTRY_OPTIONS.find((o) => o[0] === c)?.[1] ?? c)
          .join(", ")}
        {draft.countries.includes("other") ? " — " + draft.otherCountries : ""}
      </p>
      {coverageCountries(draft).map((c) => (
        <p key={c.code}>
          {c.label}:{" "}
          {draft.countryTimeUnknown || c.code === "unknown"
            ? "Time not known"
            : String(draft.countryTime[c.code] ?? "") +
              "% of total working time"}
        </p>
      ))}
      <p>Businesses: {draft.businesses}</p>
      <p>Working languages: {draft.languages}</p>
      <p>
        Supported employee population:{" "}
        {known(draft.populationBasis)
          ? draft.supportedEmployees
          : "Not known / not applicable"}{" "}
        ({draft.populationBasis})
      </p>
      <p>
        Responsibility: {AUTONOMY.find((o) => o[0] === draft.autonomy)?.[1]}
      </p>
      <p>
        Problem complexity: {draft.complexity}; decision reach: {draft.impact}
      </p>
      <p>Decision example: {draft.decisionExample}</p>
      <p>Escalation / approvals: {draft.escalation}</p>
      <p>
        Capacity: {CAPACITY.find((o) => o[0] === draft.capacity)?.[1]};
        available hours:{" "}
        {known(draft.availableBasis)
          ? draft.availableHours
          : "Not known / not applicable"}
      </p>
      <p>
        Contracted hours:{" "}
        {known(draft.hoursBasis)
          ? draft.weeklyHours
          : "Not known / not applicable"}{" "}
        ({draft.hoursBasis}); overtime: {draft.overtimeHours ?? "Not given"};
        fixed site cover: {draft.fixedOnsiteHours ?? "Not given"}
      </p>
      <p>
        Cover: {draft.backup}; unmet work: {draft.unmetWork}
      </p>
      <p>
        Peaks: {draft.peakPattern}
        {["seasonal", "events"].includes(draft.peakPattern) && (
          <>
            ;{" "}
            {draft.peakMonths
              .map((c) => MONTHS.find((o) => o[0] === c)?.[1] ?? c)
              .join(", ")}
            ; {draft.peakDescription}; extra hours:{" "}
            {known(draft.peakBasis)
              ? draft.peakExtraHours
              : "Not known / not applicable"}{" "}
            ({draft.peakBasis})
          </>
        )}
      </p>
      <p>Improvement opportunities: {draft.improvements}</p>
      <p>
        Service measures: {draft.serviceMetrics}
        {draft.serviceMetrics === "yes"
          ? ` — ${draft.metricName}; target: ${draft.metricTarget}; actual: ${draft.metricActual}; period: ${draft.metricPeriod}; source: ${draft.metricSource}`
          : ""}
      </p>
      <p>
        Provider costs: {draft.costKnowledge}
        {draft.costKnowledge === "known"
          ? ` — ${draft.providerCost} ${draft.costCurrency}; period / scope: ${draft.costPeriod}; source: ${draft.costSource}`
          : ""}
      </p>
      {selected.map((area) => {
        const w = draft.work[area] ?? emptyWorkDetail();
        return (
          <section className="tb-process" key={area}>
            <h3>
              {[...BROAD_AREAS, MANAGEMENT_AREA].find((a) => a.code === area)
                ?.label ?? area}
            </h3>
            {w.tasks.map((code) => (
              <p key={code}>
                {TASKS[area]?.find((o) => o[0] === code)?.[1] ?? code}:{" "}
                {w.taskTimeUnknown || code === "unknown"
                  ? "Time not known"
                  : String(w.taskTime[code] ?? "") + "% of this area"}
              </p>
            ))}
            {w.tasks.includes("other") && <p>{w.taskNote}</p>}
            <p>
              Local requirements:{" "}
              {w.local
                .map(
                  (c) => LOCAL_REQUIREMENTS.find((o) => o[0] === c)?.[1] ?? c,
                )
                .join(", ")}
              .{" "}
              {w.local.some((c) => !["none", "unknown"].includes(c))
                ? w.localNote
                : ""}
            </p>
            <p>
              Accountability: {OWNERSHIP.find((o) => o[0] === w.ownership)?.[1]}
              ; process owner: {w.ownerTeam}
            </p>
            <p>
              Receives from:{" "}
              {w.receives
                .map((c) => WORK_PARTIES.find((o) => o[0] === c)?.[1] ?? c)
                .join(", ")}
              . Passes to:{" "}
              {w.passes
                .map((c) => WORK_PARTIES.find((o) => o[0] === c)?.[1] ?? c)
                .join(", ")}
            </p>
            {w.handoffNote && <p>{w.handoffNote}</p>}
            {(known(w.volumeBasis) ||
              known(w.handlingBasis) ||
              known(w.reworkBasis)) && <p>Item definition: {w.volumeUnit}</p>}
            <p>
              Volume:{" "}
              {known(w.volumeBasis)
                ? `${w.volume} ${w.volumeUnit} per ${w.volumePeriod} (${w.volumeBasis})`
                : w.volumeBasis}
              . Handling:{" "}
              {known(w.handlingBasis)
                ? w.handlingMinutes +
                  " active minutes per item (" +
                  w.handlingBasis +
                  ")"
                : w.handlingBasis}
              . Rework:{" "}
              {known(w.reworkBasis)
                ? w.reworkPercent + "% (" + w.reworkBasis + ")"
                : w.reworkBasis}
            </p>
            <p>
              Delivery from another country: {w.transferable};{" "}
              {["yes", "part"].includes(w.transferable)
                ? `${w.transferPercent}% of this area — ${w.transferNote}`
                : ""}
            </p>
          </section>
        );
      })}
      <p>
        Use the edit buttons to review all entries before submitting. Suggested
        roles, capacity transfers and benefits require validation.
      </p>
      {["coverage", "work_detail", "role_capacity"].some(
        (step) => depthIssues(draft, selected, step).length > 0,
      ) && <p role="alert">Some detailed work answers need attention.</p>}
    </section>
  );
}
