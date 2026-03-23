import type { Metadata } from "next";
import ContactPageClient from "./contactpageclient";

export const metadata: Metadata = {
  title: "Contact | Greg van Esch",
  description:
    "Book a diagnostic conversation or get in touch to discuss HR operations advisory, service delivery, and transformation support.",
};

type ContactPageProps = {
  searchParams?: Promise<{
    topic?: string;
    source?: string;
  }>;
};

export default async function ContactPage({
  searchParams,
}: ContactPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <ContactPageClient
      topicParam={resolvedSearchParams?.topic ?? null}
      sourceParam={resolvedSearchParams?.source ?? null}
    />
  );
}