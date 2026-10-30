import { BASELINE_COMPLETION_GUIDANCE } from "./copy";
import type { ProxyAttribution } from "./proxy";
export function baselineSender(configured: string) {
  const address =
    configured.match(/<([^>]+)>/)?.[1]?.trim() ?? configured.trim();
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address))
    throw new Error("The baseline sender address is not configured correctly.");
  return "team.blue baseline <" + address + ">";
}
const escape = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function frame(title: string, content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,sans-serif;color:#0d1f3c"><div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px"><p style="font-size:16px;font-weight:700;color:#0d1f3c">team.blue</p><h1 style="font-size:24px;line-height:1.25">${escape(title)}</h1>${content}<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0"><p style="font-size:12px;color:#64748b">team.blue · Current work baseline<br>For help, reply to this email.</p></div></body></html>`;
}
export function invitationEmail(
  name: string,
  link: string,
  closes: string,
  _version?: string,
  attribution?: ProxyAttribution | null,
) {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(closes));
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(new Date(closes));
  const deadline = `${date} at ${time} UTC`;
  const timing = BASELINE_COMPLETION_GUIDANCE;
  if (attribution) {
    const { participantName, completerName, referencePeriod } = attribution;
    const instruction = `Complete this assessment based on ${participantName}’s usual role and work, not your own.`;
    const title = `Assessment for ${participantName}`;
    const action = `Complete ${participantName}’s assessment`;
    return {
      subject: `team.blue | Complete the baseline on behalf of ${participantName}`,
      text: `team.blue — Current work baseline\n\nHello ${completerName},\n\nPlease complete this assessment on behalf of ${participantName}. ${instruction}\n\nReference period: ${referencePeriod}.\n\nThis link opens a separate assessment for ${participantName}. Your own assessment remains separate.\n\n1. Open ${participantName}’s assessment using the link below.\n2. Verify access using the code sent to your email address.\n3. Complete the questions by ${deadline}. You can save your progress and return later.\n\nMark anything you cannot confirm and describe current coverage gaps in the final comments.\n\n${timing}\n\n${link}\n\nKeep your link and verification code private.\n\nteam.blue · Current work baseline. Reply to this email for help.`,
      html: frame(title, `<p>Hello ${escape(completerName)},</p><p>Please complete this assessment <strong>on behalf of ${escape(participantName)}</strong>.</p><p><strong>${escape(instruction)}</strong></p><p>Reference period: ${escape(referencePeriod)}.</p><p>This link opens a separate assessment for ${escape(participantName)}. Your own assessment remains separate.</p><ol style="line-height:1.7"><li>Open ${escape(participantName)}’s assessment.</li><li>Verify access using the code sent to your email address.</li><li>Complete the questions by <strong>${escape(deadline)}</strong>. You can save your progress and return later.</li></ol><p>Mark anything you cannot confirm and describe current coverage gaps in the final comments.</p><p>${timing}</p><p><a href="${escape(link)}" style="display:inline-block;background:#1e6fd9;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">${escape(action)}</a></p><p style="font-size:13px;color:#475569">Keep your link and verification code private.</p>`),
    };
  }
  const subject = "team.blue | Your current work baseline";
  return {
    subject,
    text: `team.blue — Current work baseline\n\nYou are invited to ${name}.\n\nPlease describe the work you do today and how you spend your time. Your answers will help us strengthen support and improve how we work.\n\n1. Open your assessment using the link below.\n2. Verify access using the code sent to your invitation email address.\n3. Complete the questions by ${deadline}. You can save your progress and return later.\n\n${timing}\n\n${link}\n\nKeep your link and verification code private.\n\nteam.blue · Current work baseline. Reply to this email for help.`,
    html: frame(
      "Your current work baseline",
      `<p>You are invited to ${escape(name)}.</p><p>Please describe the work you do today and how you spend your time. Your answers will help us strengthen support and improve how we work.</p><ol style="line-height:1.7"><li>Open your assessment.</li><li>Verify access using the code sent to your invitation email address.</li><li>Complete the questions by <strong>${escape(deadline)}</strong>. You can save your progress and return later.</li></ol><p>${timing}</p><p><a href="${escape(link)}" style="display:inline-block;background:#1e6fd9;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">Open your assessment</a></p><p style="font-size:13px;color:#475569">Keep your link and verification code private.</p>`,
    ),
  };
}
export function verificationEmail(code: string, link?: string) {
  return {
    subject: "team.blue | Your verification code",
    text: `team.blue — Verify access\n\nEnter this code on the baseline assessment page you already have open:\n\n${code}\n\nThe code is valid for 10 minutes. Keep it private.${link ? "\n\nKeep this email so you can return later and continue your saved answers. Whenever you use the link below, a fresh verification code will be emailed automatically. Use the most recent code.\n\nReturn to your assessment:\n" + link : ""}\n\nteam.blue · Current work baseline. Reply to this email for help.`,
    html: frame(
      "Verify access to your baseline",
      `<p>Enter this code on the baseline assessment page you already have open:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;background:#eff6ff;padding:18px;border-radius:8px">${escape(code)}</p><p>The code is valid for 10 minutes. Keep it private.</p>${link ? '<p>Keep this email so you can return later and continue your saved answers. Whenever you use the link below, a fresh verification code will be emailed automatically. Use the most recent code.</p><p><a href="' + escape(link) + '" style="color:#1e6fd9">Return to your assessment</a></p>' : ""}`,
    ),
  };
}

export function answerCopyEmail(evidence: {
  workAreas: { label: string; percentage: number | null }[];
}) {
  const summary = evidence.workAreas
    .map((a) => a.label + ": " + (a.percentage ?? 0) + "%")
    .join("\n");
  return {
    subject: "team.blue | Your baseline answers",
    text:
      "Thank you for completing your current work baseline.\n\nHere is your time allocation:\n\n" +
      summary +
      "\n\nYour answers are attached as a Word document, organised by questionnaire section. Keep this copy private.\n\nteam.blue · Current work baseline. Reply to this email for help.",
    html: frame(
      "Your baseline answers",
      "<p>Thank you for completing your current work baseline.</p><p>Your answers are attached as a Word document, organised by questionnaire section. Keep this copy private.</p><ul>" +
        evidence.workAreas
          .map(
            (a) =>
              "<li>" + escape(a.label) + ": " + (a.percentage ?? 0) + "%</li>",
          )
          .join("") +
        "</ul>",
    ),
  };
}
