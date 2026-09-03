"use client";

type VisualTone = "positive" | "caution" | "critical" | "neutral";

type PerspectivePoint = {
  key: string;
  label: string;
  value: number | null;
};

type OverviewDimension = {
  key: string;
  label: string;
  value: number | null;
};

export function DiagnosticProfile({
  title = "Diagnostic profile",
  dimensions,
}: {
  title?: string;
  dimensions: OverviewDimension[];
}) {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Common 1–5 scale across the selected diagnostic dimensions.
          </p>
        </div>
        <ScoreScaleKey compact />
      </div>

      <div className="mt-5 space-y-3">
        {dimensions.map((dimension) => (
          <div
            key={dimension.key}
            className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_2.5rem] items-center gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_3rem]"
          >
            <p className="truncate text-xs font-medium text-slate-700 sm:text-sm">
              {dimension.label}
            </p>
            <ScaleTrack value={dimension.value} compact />
            <p className="text-right text-sm font-semibold tabular-nums text-slate-900">
              {formatMetricValue(dimension.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DimensionScoreVisual({
  overallLabel = "Overall score",
  overall,
  perspectives,
  gap,
  alignmentLabel,
  gapCaption = "Perspective gap",
}: {
  overallLabel?: string;
  overall: number | null;
  perspectives: PerspectivePoint[];
  gap: number | null;
  alignmentLabel: string | null;
  gapCaption?: string;
}) {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_8.5rem] lg:items-stretch">
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {overallLabel}
          </p>
          <p className="text-lg font-semibold tabular-nums text-slate-900">
            {formatMetricValue(overall)}
          </p>
        </div>
        <div className="mt-3">
          <ScaleTrack value={overall} />
          <ScoreScaleKey />
        </div>

        {perspectives.length > 0 ? (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Perspective comparison
              </p>
              <span className="text-[11px] text-slate-400">1–5 scale</span>
            </div>
            <div className="space-y-3">
              {perspectives.map((point) => (
                <PerspectiveRow key={point.key} point={point} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <GapRing
        value={gap}
        alignmentLabel={alignmentLabel}
        caption={gapCaption}
      />
    </div>
  );
}

export function GapRing({
  value,
  alignmentLabel,
  caption,
}: {
  value: number | null;
  alignmentLabel: string | null;
  caption: string;
}) {
  const tone = gapTone(value);
  const progress = gapProgress(value);
  const toneHex = toneColour(tone);

  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-4 text-center">
      <div
        className="relative h-20 w-20 rounded-full"
        style={{
          background: `conic-gradient(${toneHex} ${progress * 3.6}deg, #e2e8f0 ${progress * 3.6}deg)`,
        }}
      >
        <div className="absolute inset-[7px] flex items-center justify-center rounded-full bg-white">
          <span className="text-lg font-semibold tabular-nums text-slate-900">
            {formatMetricValue(value)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {caption}
      </p>
      <p className={`mt-1 text-xs font-semibold ${toneTextClasses(tone)}`}>
        {alignmentLabel ?? "Not available"}
      </p>
    </div>
  );
}

export function ScoreScaleKey({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 text-[10px] font-medium text-slate-500 ${
        compact ? "mt-2 sm:mt-0" : "mt-2"
      }`}
    >
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        Weak
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Moderate
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Strong
      </span>
    </div>
  );
}

export function strengthTone(value: string | null): VisualTone {
  if (value === "strong") {
    return "positive";
  }
  if (value === "moderate") {
    return "caution";
  }
  if (value === "weak") {
    return "critical";
  }
  return "neutral";
}

export function scoreTone(value: number | null): VisualTone {
  if (typeof value !== "number") {
    return "neutral";
  }
  if (value >= 4) {
    return "positive";
  }
  if (value >= 3) {
    return "caution";
  }
  return "critical";
}

export function gapTone(value: number | null): VisualTone {
  if (typeof value !== "number") {
    return "neutral";
  }
  if (value < 0.4) {
    return "positive";
  }
  if (value < 0.75) {
    return "caution";
  }
  return "critical";
}

export function alignmentFromGap(value: number | null): string | null {
  if (typeof value !== "number") {
    return null;
  }
  if (value < 0.4) {
    return "Aligned";
  }
  if (value < 0.75) {
    return "Emerging gap";
  }
  return "Significant gap";
}

export function visiblePerspectiveGap(values: Array<number | null>): number | null {
  const numeric = values.filter((value): value is number => typeof value === "number");
  if (numeric.length < 2) {
    return null;
  }
  return Math.max(...numeric) - Math.min(...numeric);
}

function PerspectiveRow({ point }: { point: PerspectivePoint }) {
  const tone = scoreTone(point.value);
  const position = scorePosition(point.value);

  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
      <p className="truncate text-xs font-medium text-slate-600">{point.label}</p>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-2 h-px bg-slate-300" />
        <div className="absolute left-1/2 top-0 h-5 w-px bg-slate-200" />
        <div className="absolute left-3/4 top-0 h-5 w-px bg-slate-200" />
        {position !== null ? (
          <span
            className={`absolute top-[3px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white shadow-sm ${toneDotClasses(tone)}`}
            style={{ left: `${position}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p className="text-right text-xs font-semibold tabular-nums text-slate-800">
        {formatMetricValue(point.value)}
      </p>
    </div>
  );
}

function ScaleTrack({
  value,
  compact = false,
}: {
  value: number | null;
  compact?: boolean;
}) {
  const tone = scoreTone(value);
  const position = scorePosition(value);

  return (
    <div className={`relative ${compact ? "h-3" : "h-4"}`}>
      <div className="absolute inset-0 overflow-hidden rounded-full border border-slate-200 bg-white">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-rose-50" />
        <div className="absolute inset-y-0 left-1/2 w-1/4 bg-amber-50" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-emerald-50" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
        <div className="absolute inset-y-0 left-3/4 w-px bg-slate-300" />
      </div>
      {position !== null ? (
        <span
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          } ${toneDotClasses(tone)}`}
          style={{ left: `${position}%` }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

function scorePosition(value: number | null): number | null {
  if (typeof value !== "number") {
    return null;
  }
  return Math.max(0, Math.min(100, ((value - 1) / 4) * 100));
}

function gapProgress(value: number | null): number {
  if (typeof value !== "number") {
    return 0;
  }
  return Math.max(0, Math.min(100, (value / 0.75) * 100));
}

function toneColour(tone: VisualTone): string {
  switch (tone) {
    case "positive":
      return "#10b981";
    case "caution":
      return "#f59e0b";
    case "critical":
      return "#f43f5e";
    default:
      return "#94a3b8";
  }
}

function toneDotClasses(tone: VisualTone): string {
  switch (tone) {
    case "positive":
      return "bg-emerald-500";
    case "caution":
      return "bg-amber-500";
    case "critical":
      return "bg-rose-500";
    default:
      return "bg-slate-400";
  }
}

function toneTextClasses(tone: VisualTone): string {
  switch (tone) {
    case "positive":
      return "text-emerald-700";
    case "caution":
      return "text-amber-700";
    case "critical":
      return "text-rose-700";
    default:
      return "text-slate-600";
  }
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatMetricValue(value: number | null): string {
  if (typeof value !== "number") {
    return "–";
  }
  const rounded = roundMetric(value);
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(2);
}
