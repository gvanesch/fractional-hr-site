import type { Metadata } from "next";
import { Suspense } from "react";
import ContactPageClient from "./contactpageclient";

export const metadata: Metadata = {
  title: "Contact | Greg van Esch",
  description:
    "Contact Greg van Esch to discuss HR operations advisory, HR technology transformation, onboarding automation, and service delivery improvement.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageClient />
    </Suspense>
  );
}