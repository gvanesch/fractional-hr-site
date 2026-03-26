import type { Metadata } from "next";
import ContactPageClient from "./contactpageclient";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Contact | Van Esch Advisory Ltd",
  description:
    "Contact Van Esch Advisory Ltd to make an enquiry about HR operations, service delivery, HR technology, or transformation support.",
};

type ContactPageProps = {
  searchParams?: Promise<{
    topic?: string | string[];
    source?: string | string[];
  }>;
};

function getSingleValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function ContactPage({
  searchParams,
}: ContactPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const topicParam = getSingleValue(resolvedSearchParams.topic);
  const sourceParam = getSingleValue(resolvedSearchParams.source);

  return (
    <ContactPageClient topicParam={topicParam} sourceParam={sourceParam} />
  );
}