import type { Metadata } from "next";
import ContactPageClient from "./contactpageclient";

export const metadata: Metadata = {
  title: "Contact | Greg van Esch",
  description:
    "Book a diagnostic conversation or get in touch to discuss HR operations advisory, service delivery, and transformation support.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}