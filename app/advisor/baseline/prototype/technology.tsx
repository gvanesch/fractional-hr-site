"use client";
import { useEffect, useRef } from "react";
import {
  TECHNOLOGY_ACTIVITIES,
  TECHNOLOGY_TIME,
  TECHNOLOGY_ROLES,
  TECHNOLOGY_PARTNERS,
  TECHNOLOGY_SYSTEMS,
  technologyTotal,
  technologyActivities,
  technologyActivityTotal,
  technologyPlatforms,
  type TechnologyDraft,
} from "@/lib/baseline/technology-prototype";
import { toggleOption } from "@/lib/baseline/prototype-enrichment";
import { Pick } from "./context";
function Options({
  label,
  values,
  options,
  invalid,
  change,
}: {
  label: string;
  values: string[];
  options: string[][];
  invalid: boolean;
  change: (v: string[]) => void;
}) {
  return (
    <fieldset className={"tb-process" + (invalid ? " tb-invalid" : "")}>
      <legend>{label}</legend>
      <div className="tb-options">
        {options.map(([code, text, help]) => (
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
            <span>
              {text}
              {values.includes(code) && help && (
                <small className="tb-activity-help">{help}</small>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function PlatformRoles({
  label,
  values,
  invalid,
  change,
}: {
  label: string;
  values: string[];
  invalid: boolean;
  change: (values: string[]) => void;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (invalid && panel.current) panel.current.open = true;
  }, [invalid]);
  return (
    <details
      ref={panel}
      className={"tb-platform-detail" + (invalid ? " tb-invalid" : "")}
    >
      <summary>
        <span>{"Your involvement: " + label}</span>
        <small>
          {values.length
            ? values.length + " types of work selected"
            : "Not answered yet"}
        </small>
      </summary>
      <Options
        label={"Your involvement: " + label}
        values={values}
        options={TECHNOLOGY_ROLES}
        invalid={invalid}
        change={change}
      />
    </details>
  );
}
export default function Technology({
  draft: d,
  change,
  issues,
  regularSystems,
  regularOtherSystems,
}: {
  draft: TechnologyDraft;
  change: (p: Partial<TechnologyDraft>) => void;
  issues: string[];
  regularSystems: string[];
  regularOtherSystems: string;
}) {
  const bad = (k: string) => issues.includes(k);
  const text = (
    key: "otherActivity" | "otherPlatform" | "otherPartner" | "note",
    label: string,
  ) => (
    <label className="tb-field">
      <span>{label}</span>
      <textarea
        aria-label={label}
        aria-invalid={bad(key)}
        maxLength={1000}
        value={d[key]}
        onChange={(e) => change({ [key]: e.target.value })}
      />
    </label>
  );
  const ordered = [...TECHNOLOGY_SYSTEMS].sort(
    (a, b) =>
      Number(regularSystems.includes(b[0])) -
      Number(regularSystems.includes(a[0])),
  );
  return (
    <>
      <p>
        Using a system as part of your day-to-day work is different from
        administering it. Select system administration only if you configure,
        maintain or manage the system for other users.
      </p>
      <Pick
        label="Which description best matches your work with systems, data or reports?"
        value={d.involvement}
        options={[
          ["yes", "I support, maintain or improve systems, data or reports"],
          ["no", "I use tools for my other work"],
          ["unknown", "Not sure"],
        ]}
        invalid={bad("involvement")}
        change={(involvement) => change({ involvement })}
      />
      {d.involvement === "yes" && (
        <>
          <Options
            label="Technology work you regularly do"
            values={d.activities}
            options={TECHNOLOGY_ACTIVITIES}
            invalid={bad("activities")}
            change={(activities) => change({ activities, activityTime: { ...d.activityTime } })}
          />
          {d.activities.includes("other") &&
            text("otherActivity", "Other technology work")}
          {technologyActivities(d).length > 0 && <section>
            <h2>Time across your technology activities</h2>
            <p>Split your technology time across the activities you selected. Count each piece of work once. Adding an activity adds a percentage box; your existing entries stay in place.</p>
            <div className="tb-total" aria-live="polite">Activity total: {technologyActivityTotal(d)}%<small>Aim for 100% of your technology time.</small></div>
            {technologyActivities(d).map(([code, label]) => <label className="tb-field" key={code}>
              <span>{label}</span><div className="tb-percentage"><input type="number" min={0} max={100} step="any" inputMode="decimal" aria-label={"Technology activity time: " + label} aria-invalid={bad("activityTime_" + code)} value={Number.isFinite(d.activityTime?.[code]) ? d.activityTime![code] : ""} onChange={e => change({ activityTime: { ...d.activityTime, [code]: e.target.value === "" ? NaN : Number(e.target.value) } })}/><span>%</span></div>
            </label>)}
          </section>}
          <h2>How is your technology time split?</h2>
          <p>
            Think only about the time you spend on systems, data and
            improvement. Now view the same time across running, improving and delivering. This is a separate split of the same technology time. Do not add
            it to your earlier time total. Enter 0 if you do not do a type of
            work.
          </p>
          <div className="tb-total" aria-live="polite">
            Technology time: {technologyTotal(d)}%
            <small>Aim for 100% of your technology time.</small>
          </div>
          <div className="tb-technology-time">
            {TECHNOLOGY_TIME.map(([code, label, help]) => (
              <label className="tb-field" key={code}>
                <span>{label}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  inputMode="decimal"
                  aria-label={"Technology time: " + label}
                  aria-invalid={bad("time_" + code)}
                  value={Number.isFinite(d.time[code]) ? d.time[code] : ""}
                  onChange={(e) =>
                    change({
                      time: {
                        ...d.time,
                        [code]:
                          e.target.value === "" ? NaN : Number(e.target.value),
                      },
                    })
                  }
                />
                <small>{help}</small>
              </label>
            ))}
          </div>
          <Options
            label="Systems you support or improve"
            values={d.platforms}
            options={ordered}
            invalid={bad("platforms")}
            change={(platforms) =>
              change({
                platforms,
                ...(platforms.includes("other") && !d.otherPlatform.trim()
                  ? { otherPlatform: regularOtherSystems }
                  : {}),
              })
            }
          />
          <p>
            Tools you selected earlier appear first. Select only the systems you
            work on. You can select others here.
          </p>
          {d.platforms.includes("other") && (
            <>
              {text("otherPlatform", "Other systems you support or improve")}
              <p className="tb-compact-text">
                Enter one system per line. You can add up to 20 systems. We ask
                about your involvement in each system separately.
              </p>
            </>
          )}
          <section className="tb-technology-platforms">
            <h2>Your involvement in each system</h2>
            <p>You can choose more than one type of work for each system.</p>
            {technologyPlatforms(d)
              .filter((p) => p.code !== "unknown")
              .map(({ code, label }) => (
                <PlatformRoles
                  key={code}
                  label={label}
                  values={d.roles[code] ?? []}
                  invalid={bad("roles_" + code)}
                  change={(roles) =>
                    change({ roles: { ...d.roles, [code]: roles } })
                  }
                />
              ))}
          </section>
          <Options
            label="Who do you regularly work with on this technology work?"
            values={d.partners}
            options={TECHNOLOGY_PARTNERS}
            invalid={bad("partners")}
            change={(partners) => change({ partners })}
          />
          {d.partners.includes("other") &&
            text("otherPartner", "Other teams you work with")}
          {text(
            "note",
            "Anything important about your technology responsibilities we have missed? (optional)",
          )}
        </>
      )}
    </>
  );
}
export function TechnologyReview({ draft: d }: { draft: TechnologyDraft }) {
  const labels = (values: string[], options: string[][]) =>
    values.map((c) => options.find((o) => o[0] === c)?.[1] ?? c).join(", ");
  return (
    <section className="tb-process">
      <h2>Technology work</h2>
      {d.involvement !== "yes" ? (
        <p>
          {d.involvement === "no"
            ? "I only use tools for my other work."
            : "Not sure."}
        </p>
      ) : (
        <>
          <p>{labels(d.activities, TECHNOLOGY_ACTIVITIES)}</p>
          {d.activities.includes("other") && <p>{d.otherActivity}</p>}
          {d.activityTime !== undefined && technologyActivities(d).map(([code, label]) => <p key={code}>{label}: {d.activityTime![code]}% of technology time</p>)}
          {TECHNOLOGY_TIME.map(([c, l]) => (
            <p key={c}>
              {l}: {d.time[c]}% of technology time
            </p>
          ))}
          {technologyPlatforms(d).map(({ code, label }) => (
            <p key={code}>
              {label}
              {code !== "unknown" &&
                ": " + labels(d.roles[code] ?? [], TECHNOLOGY_ROLES)}
            </p>
          ))}
          <p>
            Regular collaborators: {labels(d.partners, TECHNOLOGY_PARTNERS)}
          </p>
          {d.partners.includes("other") && <p>{d.otherPartner}</p>}
          {d.note && <p>{d.note}</p>}
        </>
      )}
    </section>
  );
}
