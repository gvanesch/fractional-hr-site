import type { Metadata } from "next";
import ContactPageClient from "./contactpageclient";

export const metadata: Metadata = {
  title: "Contact | Greg van Esch",
  description:
    "Contact Greg van Esch to discuss HR operations advisory, HR technology transformation, onboarding automation, and service delivery improvement.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}