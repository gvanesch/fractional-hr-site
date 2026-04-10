import type { SegmentationFieldKey } from "@/lib/client-diagnostic/segmentation";

export type CanonicalSegmentationOption = {
  key: string;
  label: string;
};

export const CANONICAL_SEGMENTATION_OPTIONS: Record<
  SegmentationFieldKey,
  CanonicalSegmentationOption[]
> = {
  function: [
    { key: "hr", label: "HR" },
    { key: "finance", label: "Finance" },
    { key: "sales", label: "Sales" },
    { key: "marketing", label: "Marketing" },
    { key: "operations", label: "Operations" },
    { key: "product", label: "Product" },
    { key: "engineering", label: "Engineering" },
    { key: "it", label: "IT" },
    { key: "customer_success", label: "Customer Success" },
    { key: "customer_support", label: "Customer Support" },
    { key: "legal", label: "Legal" },
    { key: "procurement", label: "Procurement" },
    { key: "executive", label: "Executive" },
    { key: "other", label: "Other" },
  ],
  location: [
    { key: "global", label: "Global" },
    { key: "uk", label: "UK" },
    { key: "europe", label: "Europe" },
    { key: "emea", label: "EMEA" },
    { key: "north_america", label: "North America" },
    { key: "americas", label: "Americas" },
    { key: "apac", label: "APAC" },
    { key: "other", label: "Other" },
  ],
  level: [
    { key: "individual_contributor", label: "Individual Contributor" },
    { key: "manager", label: "Manager" },
    { key: "senior_manager", label: "Senior Manager" },
    { key: "director", label: "Director" },
    { key: "vp", label: "VP" },
    { key: "executive", label: "Executive" },
    { key: "other", label: "Other" },
  ],
};

export function getCanonicalSegmentationOptions(
  fieldKey: SegmentationFieldKey,
): CanonicalSegmentationOption[] {
  return CANONICAL_SEGMENTATION_OPTIONS[fieldKey];
}

export function isValidCanonicalSegmentationKey(
  fieldKey: SegmentationFieldKey,
  canonicalKey: string,
): boolean {
  return CANONICAL_SEGMENTATION_OPTIONS[fieldKey].some(
    (option) => option.key === canonicalKey,
  );
}

export function getCanonicalSegmentationLabel(
  fieldKey: SegmentationFieldKey,
  canonicalKey: string,
): string | null {
  const option = CANONICAL_SEGMENTATION_OPTIONS[fieldKey].find(
    (item) => item.key === canonicalKey,
  );

  return option?.label ?? null;
}