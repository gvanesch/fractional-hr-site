"use client";
import {
  MANAGEMENT_ACTIVITIES,
  type ManagementDraft,
} from "@/lib/baseline/management-prototype";
import { toggleOption } from "@/lib/baseline/prototype-enrichment";
import { Pick } from "./context";
export default function Management({
  draft: d,
  change,
  issues,
}: {
  draft: ManagementDraft;
  change: (p: Partial<ManagementDraft>) => void;
  issues: string[];
}) {
  return (
    <>
      <p>
        Tell us about managing your own team. Do not include advice you give to
        managers elsewhere in the business. You have already included management
        time in your main time allocation. There are no more percentages to
        enter here.
      </p>
      <fieldset
        className={
          "tb-process" + (issues.includes("activities") ? " tb-invalid" : "")
        }
      >
        <legend>
          Which management activities take most of your time? Choose up to
          three. ({d.activities.length}/3)
        </legend>
        <div className="tb-options">
          {MANAGEMENT_ACTIVITIES.map(([code, label, help]) => (
            <label key={code}>
              <input
                type="checkbox"
                aria-label={"Main management activities: " + label}
                checked={d.activities.includes(code)}
                disabled={
                  !d.activities.includes(code) &&
                  code !== "unknown" &&
                  d.activities.filter((c) => c !== "unknown").length >= 3
                }
                onChange={() =>
                  change({
                    activities: toggleOption(d.activities, code, 3, [
                      "unknown",
                    ]),
                  })
                }
              />
              <span>
                {label}
                {d.activities.includes(code) && (
                  <small className="tb-activity-help">{help}</small>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {d.activities.includes("other") && (
        <label className="tb-field">
          <span>Other management work</span>
          <textarea
            aria-label="Other management work"
            aria-invalid={issues.includes("other")}
            maxLength={1000}
            value={d.other}
            onChange={(e) => change({ other: e.target.value })}
          />
        </label>
      )}
      <Pick
        label="Do you manage people who also report to another manager?"
        value={d.sharedReporting}
        options={[
          ["yes", "Yes"],
          ["no", "No"],
          ["unknown", "Not sure"],
        ]}
        invalid={issues.includes("sharedReporting")}
        change={(sharedReporting) => change({ sharedReporting })}
      />
      <p>
        For example, someone may report to you for their local work and to
        another manager for specialist work.
      </p>
      <label className="tb-field">
        <span>
          Is anything making your management work take more time than it should?
          (optional)
        </span>
        <textarea
          aria-label="Is anything making your management work take more time than it should? (optional)"
          maxLength={1000}
          value={d.note}
          onChange={(e) => change({ note: e.target.value })}
        />
        <small>
          For example, unclear responsibilities or repeated meetings. Do not
          include names or details of individual employee matters.
        </small>
      </label>
    </>
  );
}
export function ManagementReview({ draft: d }: { draft: ManagementDraft }) {
  return (
    <section className="tb-process">
      <h2>Managing your team</h2>
      <p>
        Main activities:{" "}
        {d.activities
          .map((c) => MANAGEMENT_ACTIVITIES.find((o) => o[0] === c)?.[1] ?? c)
          .join(", ")}
      </p>
      {d.activities.includes("other") && <p>{d.other}</p>}
      <p>
        Shared reporting:{" "}
        {{ yes: "Yes", no: "No", unknown: "Not sure" }[d.sharedReporting] ??
          d.sharedReporting}
      </p>
      {d.note && <p>{d.note}</p>}
    </section>
  );
}
