"use client";
import {
  TECHNOLOGY_ACTIVITIES,
  TECHNOLOGY_TIME,
  TECHNOLOGY_ROLES,
  TECHNOLOGY_PARTNERS,
  TECHNOLOGY_SYSTEMS,
  technologyTotal,
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
export default function Technology({
  draft: d,
  change,
  issues,
  regularSystems,
}: {
  draft: TechnologyDraft;
  change: (p: Partial<TechnologyDraft>) => void;
  issues: string[];
  regularSystems: string[];
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
        This section is about work on systems and data. Using a tool for
        everyday work is different from supporting or improving it.
      </p>
      <Pick
        label="Do you support, maintain or improve systems, data or reports?"
        value={d.involvement}
        options={[
          ["yes", "Yes"],
          ["no", "No. I only use tools for my other work."],
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
            change={(activities) => change({ activities })}
          />
          {d.activities.includes("other") &&
            text("otherActivity", "Other technology work")}
          <h2>How is your technology time split?</h2>
          <p>
            Think only about the time you spend on systems, data and
            improvement. Split that time across these three groups. Do not add
            it to your earlier time total. Enter 0 if you do not do a type of
            work.
          </p>
          <div className="tb-total" aria-live="polite">
            Technology time: {technologyTotal(d)}%
            <small>Aim for 100% of your technology time.</small>
          </div>
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
          <Options
            label="Systems you support or improve"
            values={d.platforms}
            options={ordered}
            invalid={bad("platforms")}
            change={(platforms) => change({ platforms })}
          />
          <p>
            Tools you selected earlier appear first. Select only the systems you
            work on. You can select others here.
          </p>
          {d.platforms.includes("other") &&
            text("otherPlatform", "Other systems you support or improve")}
          {d.platforms
            .filter((c) => c !== "unknown")
            .map((code) => (
              <Options
                key={code}
                label={
                  "Your involvement: " +
                  (code === "other"
                    ? d.otherPlatform || "Other systems"
                    : TECHNOLOGY_SYSTEMS.find((o) => o[0] === code)?.[1])
                }
                values={d.roles[code] ?? []}
                options={TECHNOLOGY_ROLES}
                invalid={bad("roles_" + code)}
                change={(roles) =>
                  change({ roles: { ...d.roles, [code]: roles } })
                }
              />
            ))}
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
          {TECHNOLOGY_TIME.map(([c, l]) => (
            <p key={c}>
              {l}: {d.time[c]}% of technology time
            </p>
          ))}
          {d.platforms.map((c) => (
            <p key={c}>
              {c === "other"
                ? d.otherPlatform
                : labels([c], TECHNOLOGY_SYSTEMS)}
              {c !== "unknown" &&
                ": " + labels(d.roles[c] ?? [], TECHNOLOGY_ROLES)}
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
