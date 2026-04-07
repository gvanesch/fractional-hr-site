import type { Metadata } from "next";
import { Suspense } from "react";
import ContactPageClient from "./contactpageclient";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Contact | Van Esch Advisory Ltd",
  description:
    "Contact Van Esch Advisory Ltd to make an enquiry about HR operations, service delivery, HR technology, or transformation support.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageClient />
    </Suspense>
  );
}