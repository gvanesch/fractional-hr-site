// Attribution is roster-owned. It never changes the questionnaire definition.
export const PROXY_FIELDS = ["response_source", "completer_name", "completer_email", "reference_period", "proxy_note"];
export type ProxyAttribution = { participantName: string; completerName: string; completerEmail: string; referencePeriod: string; note: string };
export function proxyAttribution(profile: Record<string, unknown>, metadata: Record<string, unknown>): ProxyAttribution | null {
  if (metadata.response_source !== "proxy") return null;
  return { participantName: String(profile.name ?? ""), completerName: String(metadata.completer_name ?? ""), completerEmail: String(metadata.completer_email ?? ""), referencePeriod: String(metadata.reference_period ?? ""), note: String(metadata.proxy_note ?? "") };
}
export function validateProxyFields(p: Record<string, string>) {
  if (!PROXY_FIELDS.some(k => p[k])) return;
  if (p.response_source !== "proxy" || !p.completer_name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.completer_email ?? "") || !p.reference_period?.trim())
    throw Error("For completion on behalf of someone else, use response_source=proxy and record the completer name, completer email and reference period.");
  p.completer_email = p.completer_email.toLowerCase();
}
const escape = (v: string) => v.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]!);
export function attributedMessage<T extends {subject: string; text: string; html: string}>(message: T, attribution: ProxyAttribution | null): T {
  if (!attribution) return message;
  const notice = `Completed on behalf of ${attribution.participantName} by ${attribution.completerName}. Reference period: ${attribution.referencePeriod}. Describe that person's usual role. Use the final comments for estimates, unknowns and current coverage gaps.`;
  return {...message, subject: `On behalf of ${attribution.participantName}: ${message.subject}`, text: notice + "\n\n" + message.text, html: message.html.replace(/(<body[^>]*>)/, "$1<p>" + escape(notice) + "</p>")};
}
