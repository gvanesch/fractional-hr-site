const escape = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function frame(title: string, content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,sans-serif;color:#0d1f3c"><div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px"><p style="font-size:16px;font-weight:700;color:#0d1f3c">team.blue</p><h1 style="font-size:24px;line-height:1.25">${escape(title)}</h1>${content}<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0"><p style="font-size:12px;color:#64748b">This baseline is hosted and sent by Van Esch Advisory for team.blue.<br>For help, reply to this email.</p></div></body></html>`;
}
export function invitationEmail(name: string, link: string, closes: string) {
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(closes));
  const subject = "team.blue | Your current work baseline";
  return {
    subject,
    text: `team.blue — Current work baseline\n\nYou are invited to ${name}.\n\nPlease describe the work you do today and how you spend your time. Your answers will help us strengthen support and improve how we work.\n\n1. Open your assessment using the link below.\n2. Verify access using the code sent to your invitation email address.\n3. Complete the questions by ${date} (UTC). You can save your progress and return later.\n\nMost people will take around 10–15 minutes. A broad role may take closer to 20–30 minutes.\n\n${link}\n\nKeep your link and verification code private.\n\nHosted and sent by Van Esch Advisory for team.blue. Reply to this email for help.`,
    html: frame(
      "Your current work baseline",
      `<p>You are invited to ${escape(name)}.</p><p>Please describe the work you do today and how you spend your time. Your answers will help us strengthen support and improve how we work.</p><ol style="line-height:1.7"><li>Open your assessment.</li><li>Verify access using the code sent to your invitation email address.</li><li>Complete the questions by <strong>${escape(date)} (UTC)</strong>. You can save your progress and return later.</li></ol><p>Most people will take around 10–15 minutes. A broad role may take closer to 20–30 minutes.</p><p><a href="${escape(link)}" style="display:inline-block;background:#1e6fd9;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px">Open your assessment</a></p><p style="font-size:13px;color:#475569">Keep your link and verification code private.</p>`,
    ),
  };
}
export function verificationEmail(code: string) {
  return {
    subject: "team.blue | Your verification code",
    text: `team.blue — Verify access\n\nEnter this code on the baseline assessment page:\n\n${code}\n\nThe code is valid for 10 minutes. Keep it private.\n\nHosted and sent by Van Esch Advisory for team.blue. Reply to this email for help.`,
    html: frame(
      "Verify access to your baseline",
      `<p>Enter this code on the baseline assessment page:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;background:#eff6ff;padding:18px;border-radius:8px">${escape(code)}</p><p>The code is valid for 10 minutes. Keep it private.</p>`,
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
      "\n\nYour complete answers are attached. Keep this copy private.\n\nHosted and sent by Van Esch Advisory for team.blue.",
    html: frame(
      "Your baseline answers",
      "<p>Thank you for completing your current work baseline.</p><p>Your complete answers are attached. Keep this copy private.</p><ul>" +
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
