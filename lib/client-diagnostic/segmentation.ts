import {
  isValidCanonicalSegmentationKey,
} from "@/lib/client-diagnostic/canonical-segmentation";

export type SegmentationFieldKey = "function" | "location" | "level";

export type SegmentationOption = {
  optionKey: string;
  optionLabel: string;
  canonicalKey: string;
};

export type SegmentationFieldDefinition = {
  fieldKey: SegmentationFieldKey;
  fieldLabel: string;
  options: SegmentationOption[];
};

export type SegmentationSchema = {
  fields: SegmentationFieldDefinition[];
};

export type SegmentationValues = Partial<
  Record<SegmentationFieldKey, string>
>;

const SEGMENTATION_FIELD_KEYS: SegmentationFieldKey[] = [
  "function",
  "location",
  "level",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normaliseKey(value: string): string {
  return value.trim().toLowerCase();
}

export function isSegmentationFieldKey(
  value: string,
): value is SegmentationFieldKey {
  return SEGMENTATION_FIELD_KEYS.includes(value as SegmentationFieldKey);
}

export function slugifySegmentationOptionKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function validateSegmentationSchema(
  value: unknown,
): SegmentationSchema | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const rawFields = value.fields;

  if (!Array.isArray(rawFields)) {
    return null;
  }

  const seenFieldKeys = new Set<string>();
  const fields: SegmentationFieldDefinition[] = [];

  for (const rawField of rawFields) {
    if (!isPlainObject(rawField)) {
      return null;
    }

    const rawFieldKey = rawField.fieldKey;
    const rawFieldLabel = rawField.fieldLabel;
    const rawOptions = rawField.options;

    if (!isNonEmptyString(rawFieldKey) || !isSegmentationFieldKey(rawFieldKey)) {
      return null;
    }

    if (!isNonEmptyString(rawFieldLabel)) {
      return null;
    }

    if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
      return null;
    }

    const normalisedFieldKey = normaliseKey(rawFieldKey);

    if (seenFieldKeys.has(normalisedFieldKey)) {
      return null;
    }

    seenFieldKeys.add(normalisedFieldKey);

    const seenOptionKeys = new Set<string>();
    const options: SegmentationOption[] = [];

    for (const rawOption of rawOptions) {
      if (!isPlainObject(rawOption)) {
        return null;
      }

      const rawOptionKey = rawOption.optionKey;
      const rawOptionLabel = rawOption.optionLabel;
      const rawCanonicalKey = rawOption.canonicalKey;

      if (
        !isNonEmptyString(rawOptionKey) ||
        !isNonEmptyString(rawOptionLabel) ||
        !isNonEmptyString(rawCanonicalKey)
      ) {
        return null;
      }

      const normalisedOptionKey = normaliseKey(rawOptionKey);
      const normalisedCanonicalKey = normaliseKey(rawCanonicalKey);

      if (seenOptionKeys.has(normalisedOptionKey)) {
        return null;
      }

      if (
        !isValidCanonicalSegmentationKey(
          rawFieldKey,
          normalisedCanonicalKey,
        )
      ) {
        return null;
      }

      seenOptionKeys.add(normalisedOptionKey);

      options.push({
        optionKey: normalisedOptionKey,
        optionLabel: rawOptionLabel.trim(),
        canonicalKey: normalisedCanonicalKey,
      });
    }

    fields.push({
      fieldKey: rawFieldKey,
      fieldLabel: rawFieldLabel.trim(),
      options,
    });
  }

  const fieldsByKey = new Set(fields.map((field) => field.fieldKey));

  if (fieldsByKey.size !== SEGMENTATION_FIELD_KEYS.length) {
    return null;
  }

  for (const key of SEGMENTATION_FIELD_KEYS) {
    if (!fieldsByKey.has(key)) {
      return null;
    }
  }

  return { fields };
}

export function validateSegmentationValues(
  schema: SegmentationSchema,
  value: unknown,
): SegmentationValues | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const schemaMap = new Map(
    schema.fields.map((field) => [
      field.fieldKey,
      new Set(field.options.map((option) => option.optionKey)),
    ]),
  );

  const parsed: SegmentationValues = {};

  for (const fieldKey of SEGMENTATION_FIELD_KEYS) {
    const rawSelectedValue = value[fieldKey];

    if (!isNonEmptyString(rawSelectedValue)) {
      return null;
    }

    const normalisedSelectedValue = normaliseKey(rawSelectedValue);
    const validOptionKeys = schemaMap.get(fieldKey);

    if (!validOptionKeys || !validOptionKeys.has(normalisedSelectedValue)) {
      return null;
    }

    parsed[fieldKey] = normalisedSelectedValue;
  }

  return parsed;
}

export function buildDefaultSegmentationSchema(): SegmentationSchema {
  return {
    fields: [
      {
        fieldKey: "function",
        fieldLabel: "Function",
        options: [
          {
            optionKey: "hr_people",
            optionLabel: "HR / People",
            canonicalKey: "hr",
          },
          {
            optionKey: "operations",
            optionLabel: "Operations",
            canonicalKey: "operations",
          },
          {
            optionKey: "sales",
            optionLabel: "Sales",
            canonicalKey: "sales",
          },
        ],
      },
      {
        fieldKey: "location",
        fieldLabel: "Location",
        options: [
          {
            optionKey: "uk",
            optionLabel: "UK",
            canonicalKey: "uk",
          },
          {
            optionKey: "emea",
            optionLabel: "EMEA",
            canonicalKey: "emea",
          },
          {
            optionKey: "global",
            optionLabel: "Global",
            canonicalKey: "global",
          },
        ],
      },
      {
        fieldKey: "level",
        fieldLabel: "Level",
        options: [
          {
            optionKey: "individual_contributor",
            optionLabel: "Individual Contributor",
            canonicalKey: "individual_contributor",
          },
          {
            optionKey: "manager",
            optionLabel: "Manager",
            canonicalKey: "manager",
          },
          {
            optionKey: "leadership",
            optionLabel: "Leadership",
            canonicalKey: "executive",
          },
        ],
      },
    ],
  };
}