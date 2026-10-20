"use client";
import { useEffect, useId, useRef } from "react";
import { Pick } from "./context";
import Info from "./info";
import { toggleOption } from "@/lib/baseline/prototype-enrichment";
import { BROAD_AREAS } from "@/lib/baseline/broad-prototype";
import { MANAGEMENT_AREA } from "@/lib/baseline/management-prototype";
import { areaQuestions, asksRework } from "@/lib/baseline/work-area-questions";
import {
  PROJECT_COUNTRIES,
  COUNTRY_OPTIONS,
  TASKS,
  CAPACITY,
  AUTONOMY,
  emptyWorkDetail,
  coverageCountries,
  sumShares,
  depthIssues,
  depthEvidence,
  contributionsFor,
  handoffOptions,
  type DepthDraft,
  type WorkDetail,
} from "@/lib/baseline/depth";

function Checks({
  label,
  values,
  options,
  change,
  invalid = false,
  help = "",
}: {
  label: string;
  values: string[];
  options: string[][];
  change: (v: string[]) => void;
  invalid?: boolean;
  help?: string;
}) {
  return (
    <fieldset className={"tb-process" + (invalid ? " tb-invalid" : "")}>
      <legend>
        {label}
        {help && <Info label={label}>{help}</Info>}
      </legend>
      {help && <p className="tb-compact-text">{help}</p>}
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
  const id = useId();
  return (
    <div className="tb-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={help ? id + "-help" : undefined}
        value={value}
        maxLength={2000}
        onChange={(e) => change(e.target.value)}
      />
      {help && <small id={id + "-help"}>{help}</small>}
    </div>
  );
}
function NumberField({
  label,
  value,
  change,
  invalid = false,
  max = 100,
  help = "",
}: {
  label: string;
  value: number | null | undefined;
  change: (v: number | null) => void;
  invalid?: boolean;
  max?: number;
  help?: string;
}) {
  const id = useId();
  return (
    <div className="tb-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={0}
        max={max}
        step="any"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={help ? id + "-help" : undefined}
        value={typeof value === "number" && Number.isFinite(value) ? value : ""}
        onChange={(e) =>
          change(e.target.value === "" ? null : Number(e.target.value))
        }
      />
      {help && <small id={id + "-help"}>{help}</small>}
    </div>
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
  // Leave open/closed state with the browser. Autosave must not reset a panel
  // that the respondent has just opened.
  return (
    <details
      ref={panel}
      className={"tb-process" + (invalid ? " tb-invalid" : "")}
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
  const bad = (key: string) => issues.includes(key);
  const text = (key: keyof DepthDraft, label: string, help = "") => (
    <Text
      label={label}
      help={help}
      value={String(d[key] ?? "")}
      invalid={bad(key)}
      change={(v) => change({ [key]: v })}
    />
  );
  const pick = (
    key: keyof DepthDraft,
    label: string,
    options: string[][],
    help = "",
  ) => (
    <Pick
      label={label}
      value={String(d[key] ?? "")}
      invalid={bad(key)}
      options={options}
      help={help}
      change={(v) => change({ [key]: v })}
    />
  );
  const num = (key: keyof DepthDraft, label: string, max = 168, help = "") => (
    <NumberField
      label={label}
      max={max}
      help={help}
      value={d[key] as number | null}
      invalid={bad(key)}
      change={(v) => change({ [key]: v })}
    />
  );
  if (step === "coverage")
    return (
      <>
        <p>
          Tell us where you work and which countries and businesses you support.
          These may be different.
        </p>
        {pick(
          "basedCountry",
          "Which country are you normally based in for work?",
          [
            ...PROJECT_COUNTRIES.map(([code, label]) => [code, label]),
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
          help="Include countries you support remotely. Choose Group-wide for shared Group work that you cannot link to individual countries."
          change={(countries) => change({ countries })}
        />
        {d.countries.includes("other") &&
          text(
            "otherCountries",
            "Other countries you support",
            "Enter one country per line. Include countries outside the core list if relevant.",
          )}
        {!d.countries.includes("unknown") && d.countries.length > 0 && (
          <>
            <h2>Time supporting each country</h2>
            <p>
              This describes the same working time as your work-area split,
              viewed by country. Count each hour once. Aim for 100%.
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
                  Country time total:{" "}
                  {sumShares(
                    coverageCountries(d).map((c) => c.code),
                    d.countryTime,
                  )}
                  %
                </div>
                {coverageCountries(d).map(({ code, label }) => (
                  <NumberField
                    key={code}
                    label={"Country time: " + label + " (%)"}
                    value={d.countryTime[code]}
                    invalid={bad("countryTime_" + code)}
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
          "List the names, or write Group-wide. Include businesses you support in addition to your employing business.",
        )}
        {num(
          "supportedEmployees",
          "Approximately how many employees do you regularly support?",
          1e9,
        )}
        {text(
          "languages",
          "Which languages can you use to deliver this work, and at what working level?",
          "For example: English — professional; Finnish — everyday employee support. Write Not sure if needed.",
        )}
      </>
    );
  if (step === "work_detail")
    return (
      <>
        <p>
          Open each work area you selected. Choose the activities you do. You do
          not need another percentage split here. Examples and the i buttons
          explain the questions.
        </p>
        {selected.map((area) => {
          const w = d.work[area] ?? emptyWorkDetail(),
            q = areaQuestions(area),
            p = area + "_";
          const label =
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
          const nextOptions = q.nextStep
            ? handoffOptions(area, "passes").filter((o) =>
                q.nextStep![2].includes(o[0]),
              )
            : [];
          return (
            <AreaPanel
              key={area}
              label={label}
              invalid={issues.some((i) => i.startsWith(p))}
            >
              <p>{q.intro}</p>
              {area === "other" ? (
                <>
                  {txt(
                    "taskNote",
                    "Describe the other work you do",
                    "Explain the purpose, examples and how often the work arises. A few sentences are enough.",
                  )}
                  {txt(
                    "handoffNote",
                    "Who requests this work, what do you provide, and who receives it? (optional)",
                    "Use team or role names. Explain anything else that helps describe this work.",
                  )}
                </>
              ) : (
                <>
                  {TASKS[area] && (
                    <>
                      <Checks
                        label={label + ": Work you actually do"}
                        values={w.tasks}
                        options={[...TASKS[area], ["unknown", "Not sure"]]}
                        help="Select all that apply to your own work. You can choose several activities. No percentages are needed."
                        invalid={bad(p + "tasks")}
                        change={(tasks) => update({ tasks })}
                      />
                      {w.tasks.includes("other") &&
                        txt(
                          "taskNote",
                          "Describe the other activity",
                          "Describe an activity in this work area that the list does not cover.",
                        )}
                    </>
                  )}
                  {q.contributions && (
                    <Checks
                      label={label + ": How are you involved?"}
                      values={contributionsFor(w)}
                      options={q.contributions}
                      invalid={bad(p + "contributions")}
                      help="Select all that apply. Work and leadership can be shared with colleagues or the team lead. You do not need to be the only person responsible."
                      change={(contributions) => update({ contributions })}
                    />
                  )}
                  {q.scope && txt("scopeNote", ...q.scope)}
                  {q.local && txt("localNote", ...q.local)}
                  {q.nextStep && (
                    <Checks
                      label={label + ": " + q.nextStep[0]}
                      options={nextOptions}
                      values={w.passes.filter((code) =>
                        nextOptions.some((o) => o[0] === code),
                      )}
                      invalid={bad(p + "passes")}
                      help={q.nextStep[1] + " This question is optional."}
                      change={(passes) => update({ passes })}
                    />
                  )}
                  {q.collaboration && txt("handoffNote", ...q.collaboration)}
                  {q.volume && (
                    <>
                      <NumberField
                        label={label + ": " + q.volume[0]}
                        max={1e9}
                        value={w.volume}
                        invalid={bad(p + "volume")}
                        help={q.volume[1]}
                        change={(volume) => update({ volume })}
                      />
                      {w.volume !== null && (
                        <>
                          <Pick
                            label={label + ": Period for this number"}
                            value={w.volumePeriod}
                            invalid={bad(p + "volumePeriod")}
                            options={[
                              ["week", "Per typical week"],
                              ["month", "Per typical month"],
                              ["year", "Per year"],
                            ]}
                            change={(volumePeriod) => update({ volumePeriod })}
                          />
                          {txt(
                            "volumeUnit",
                            "What did you count?",
                            "For example: joiners, leavers, contract changes or absence updates. Use the type of item that matches the number above.",
                          )}
                        </>
                      )}
                    </>
                  )}
                  {asksRework(area, w.tasks) && (
                    <NumberField
                      label={
                        label +
                        ": Share of document or record updates needing correction (%, optional estimate)"
                      }
                      value={w.reworkPercent}
                      invalid={bad(p + "reworkPercent")}
                      help="For example, 5 out of 100 updates need a missing detail added or an incorrect entry fixed: enter 5. Leave blank if you cannot estimate."
                      change={(reworkPercent) => update({ reworkPercent })}
                    />
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
        <h2>Your decisions</h2>
        {pick(
          "autonomy",
          "How do you usually make decisions in your work?",
          AUTONOMY,
          "Think about your usual work. Working independently can still include discussing options with colleagues. Asking for advice is different from needing approval.",
        )}
        {pick(
          "complexity",
          "What kind of problems do you usually resolve?",
          [
            ["standard", "Mostly standard tasks with known answers"],
            ["varied", "Different situations, using established guidance"],
            ["complex", "Complex exceptions needing specialist judgement"],
            ["novel", "New problems without established answers"],
            ["unknown", "Not sure"],
          ],
          "For example: follow a standard process, choose how to handle an unusual request, or design an approach for a new situation.",
        )}
        {pick(
          "impact",
          "Who is usually affected by decisions you make?",
          [
            ["individual", "An individual request or case"],
            ["team", "A team or local service"],
            ["country", "A country or business"],
            ["regional", "Several countries or a region"],
            ["group", "Group-wide services or policy"],
            ["unknown", "Not sure"],
          ],
          "Choose the usual reach of your own decisions, rather than the size of the audience you support. For example, arranging one training session is different from setting Group learning policy.",
        )}
        {text(
          "decisionExample",
          "One example of a decision you make (optional)",
          "Briefly explain the decision and any limits. Use role or team names. Do not include personal employee details.",
        )}
        {text(
          "escalation",
          "When do you need someone else's approval? (optional)",
          "For example, a budget exception, a change to policy or new system access. Name the approving role or team, or write No regular approvals needed.",
        )}
        <h2>Your workload</h2>
        <p>
          Think about a typical week. Estimates are enough. You can leave
          optional numbers blank if you cannot give a useful estimate.
        </p>
        {pick(
          "capacity",
          "How does current demand compare with your available time?",
          CAPACITY,
          "Think about whether you can complete your usual work in your normal working pattern. Include fixed cover and planned work as well as incoming requests.",
        )}
        {num(
          "overtimeHours",
          "Typical additional hours worked per week (optional)",
          168,
          "Hours worked beyond your normal working pattern. For example, enter 2 for about two extra hours in a typical week.",
        )}
        {num(
          "availableHours",
          "Uncommitted hours in a typical week (optional estimate)",
          168,
          "Time that is usually free after your current work and required cover. Enter 0 if none. Do not include time that could only become free after changing a process.",
        )}
        {selected.includes("office") &&
          num(
            "fixedOnsiteHours",
            "Hours per week committed to physical site / reception cover (optional)",
            168,
            "Include hours when you must be available at the site, even if visitor numbers vary. These hours are a commitment, not free time.",
          )}
        {text(
          "unmetWork",
          "Work that is regularly delayed or left unfinished (optional)",
          "Name the type of work and when the pressure occurs. For example, benefit questions wait during payroll week, or reporting tasks wait during a system launch.",
        )}
        {pick(
          "backup",
          "Could someone cover your main work if you were away?",
          [
            ["full", "Yes, all main work"],
            ["partial", "Some work only"],
            ["none", "No trained cover"],
            ["unknown", "Not sure"],
          ],
          "Cover means someone with the knowledge and access needed to do the work. It does not mean they already have spare time.",
        )}
        {pick(
          "peakPattern",
          "Are there predictable peaks or major event-driven demands?",
          [
            ["none", "No significant peaks"],
            ["seasonal", "Regular annual or seasonal peaks"],
            ["events", "Peaks linked to events or projects"],
            ["unknown", "Not sure"],
          ],
          "For example, annual performance reviews, salary reviews, a survey, a recruitment campaign, an office move or a systems launch. Choose what applies to your work.",
        )}
        {["seasonal", "events"].includes(d.peakPattern) && (
          <>
            {text(
              "peakDescription",
              "What causes the peaks, and when do they happen?",
              "Include the months or event, how long the busy period lasts and any work you postpone. For example: annual performance reviews in November, lasting about three weeks.",
            )}
            {num(
              "peakExtraHours",
              "Additional work hours required per peak week (optional estimate)",
              168,
              "Extra hours of work needed in a busy week compared with a typical week. Leave blank if you cannot estimate.",
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
  const e = depthEvidence(draft, selected);
  return (
    <section className="tb-process">
      <h2>Your work, coverage and workload</h2>
      <p>
        Work base:{" "}
        {draft.basedCountry === "other"
          ? draft.basedOther
          : (PROJECT_COUNTRIES.find((c) => c[0] === draft.basedCountry)?.[1] ??
            draft.basedCountry)}
      </p>
      <p>Businesses: {e.businesses}</p>
      <p>Working languages: {e.languages}</p>
      <p>
        Supported employee population: {e.supportedEmployees ?? "Not given"}
      </p>
      {e.countries.map((c) => (
        <p key={c.code}>
          {c.label}:{" "}
          {c.shareOfWorkingTime === null
            ? "Time not estimated"
            : c.shareOfWorkingTime + "% of total working time"}
        </p>
      ))}
      {e.work.map((w) => {
        const q = areaQuestions(w.area),
          label =
            [...BROAD_AREAS, MANAGEMENT_AREA].find((a) => a.code === w.area)
              ?.label ?? w.area;
        return (
          <section className="tb-process" key={w.area}>
            <h3>{label}</h3>
            {!!w.tasks.length && (
              <p>Activities: {w.tasks.map((t) => t.label).join(", ")}</p>
            )}
            {w.taskNote && <p>{w.taskNote}</p>}
            {!!w.contributions?.length && (
              <p>
                Your involvement:{" "}
                {w.contributions
                  .map(
                    (code) =>
                      q.contributions?.find((o) => o[0] === code)?.[1] ?? code,
                  )
                  .join(", ")}
              </p>
            )}
            {w.scopeNote && <p>{w.scopeNote}</p>}
            {w.localNote && <p>{w.localNote}</p>}
            {q.nextStep && !!w.passes.length && (
              <p>
                Next step or approval:{" "}
                {w.passes
                  .map(
                    (code) =>
                      handoffOptions(w.area, "passes").find(
                        (o) => o[0] === code,
                      )?.[1] ?? code,
                  )
                  .join(", ")}
              </p>
            )}
            {w.handoffNote && <p>{w.handoffNote}</p>}
            {w.volume !== null && (
              <p>
                Personal volume: {w.volume} {w.volumeUnit} per {w.volumePeriod}{" "}
                (estimate)
              </p>
            )}
            {w.reworkPercent !== null && (
              <p>
                Document or record corrections: {w.reworkPercent}% (estimate)
              </p>
            )}
          </section>
        );
      })}
      <p>
        Decision-making: {AUTONOMY.find((o) => o[0] === e.role.autonomy)?.[1]}
      </p>
      <p>
        Problem types: {e.role.complexity}; reach of decisions: {e.role.impact}
      </p>
      {e.role.decisionExample && <p>Example: {e.role.decisionExample}</p>}
      {e.role.escalation && <p>Approvals needed: {e.role.escalation}</p>}
      <p>Workload: {CAPACITY.find((o) => o[0] === e.capacity.capacity)?.[1]}</p>
      <p>
        Additional weekly hours: {e.capacity.overtimeHours ?? "Not given"};
        uncommitted hours: {e.capacity.availableHours ?? "Not given"}
      </p>
      {e.capacity.fixedOnsiteHours !== null && (
        <p>Site cover: {e.capacity.fixedOnsiteHours} hours per week</p>
      )}
      {e.capacity.unmetWork && <p>Delayed work: {e.capacity.unmetWork}</p>}
      <p>
        Cover: {e.capacity.backup}; workload peaks: {e.peaks.pattern}
      </p>
      {e.peaks.description && <p>{e.peaks.description}</p>}
      {e.peaks.extraWeeklyHours !== null && (
        <p>Additional peak hours: {e.peaks.extraWeeklyHours} (estimate)</p>
      )}
      <p>
        Use the edit buttons if you want to change an answer before submitting.
      </p>
      {["coverage", "work_detail", "role_capacity"].some(
        (step) => depthIssues(draft, selected, step).length > 0,
      ) && <p role="alert">Some answers need attention.</p>}
    </section>
  );
}
