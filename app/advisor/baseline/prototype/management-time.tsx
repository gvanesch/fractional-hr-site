"use client";
import {
  MANAGEMENT_TIME_GROUPS,
  managementTimeTotal,
  managementTimeEvidence,
  type ManagementTimeDraft,
} from "@/lib/baseline/management-time-preview";
export default function ManagementTime({
  draft: d,
  change,
  issues,
}: {
  draft: ManagementTimeDraft;
  change: (p: Partial<ManagementTimeDraft>) => void;
  issues: string[];
}) {
  return (
    <>
      <p>
        Think about managing your own team. You have already included this time
        in your main allocation. Now split that management time across the
        groups below.
      </p>
      <p>
        Aim for 100% of your management time. Enter 0 for work you do not do.
        Count each activity once. For example, record a one-to-one performance
        conversation under Individual support.
      </p>
      <label className="tb-check">
        <input
          type="checkbox"
          checked={d.uncertain}
          onChange={(e) => change({ uncertain: e.target.checked })}
        />
        Not sure how to split my management time
      </label>
      {!d.uncertain && (
        <>
          <div className="tb-total" aria-live="polite">
            Management time: {managementTimeTotal(d)}%
            <small>This divides the management time you already entered.</small>
          </div>
          <div className="tb-technology-time">
            {MANAGEMENT_TIME_GROUPS.map(([code, label, help]) => (
              <label
                className={
                  "tb-field" +
                  (issues.includes("time_" + code) ? " tb-invalid" : "")
                }
                key={code}
              >
                <span>
                  {label}
                  {code === "other" ? " (optional)" : ""}
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  inputMode="decimal"
                  aria-label={"Management time: " + label}
                  aria-invalid={issues.includes("time_" + code)}
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
          {d.time.other > 0 && (
            <label
              className={
                "tb-field" + (issues.includes("other") ? " tb-invalid" : "")
              }
            >
              <span>Describe your other management work</span>
              <textarea
                aria-label="Describe your other management work"
                aria-invalid={issues.includes("other")}
                maxLength={1000}
                value={d.other}
                onChange={(e) => change({ other: e.target.value })}
              />
            </label>
          )}
        </>
      )}
    </>
  );
}
export function ManagementTimeReview({
  draft,
  workingShare,
}: {
  draft: ManagementTimeDraft;
  workingShare: number;
}) {
  const e = managementTimeEvidence(draft, workingShare);
  return e.uncertain ? (
    <p>Management time split: Not sure</p>
  ) : (
    <>
      <p>
        These percentages divide your management time. The overall figures are
        approximate.
      </p>
      {e.groups.map((g) => (
        <p key={g.code}>
          {g.label}: {g.shareOfManagementTime}% of management time (
          {g.approximateShareOfWorkingTime}% of working time)
          {"description" in g && g.description ? ". " + g.description : ""}
        </p>
      ))}
    </>
  );
}
