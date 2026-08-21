import { Resend } from "resend";

export type ParticipantEmailQuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

export type ParticipantEventEmailType =
  | "invite"
  | "invite_extended"
  | "participant_withdrawn"
  | "participant_reinstated";

export type ParticipantEventEmailParams = {
  resend: Resend;
  fromEmail: string;
  replyToEmail: string;
  siteUrl: string;
  projectName: string;
  companyName?: string | null;
  participant: {
    name: string;
    email: string;
    questionnaireType: ParticipantEmailQuestionnaireType;
    inviteToken?: string | null;
    inviteExpiresAt?: string | null;
  };
  eventType: ParticipantEventEmailType;
  metadata?: {
    previousInviteExpiresAt?: string | null;
    updatedInviteExpiresAt?: string | null;
    withdrawReasonLabel?: string | null;
    withdrawNote?: string | null;
    reinstateReasonLabel?: string | null;
    reinstateNote?: string | null;
  };
};

export type ParticipantEventEmailResult = {
  email: string;
  success: boolean;
  resendId: string | null;
  error: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

function getDiagnosticPath(inviteToken: string): string {
  return `/client-diagnostic/respond/${inviteToken}`;
}

function getQuestionnaireDisplayLabel(
  questionnaireType: ParticipantEmailQuestionnaireType,
): string {
  switch (questionnaireType) {
    case "hr":
      return "HR diagnostic";
    case "manager":
      return "Manager diagnostic";
    case "leadership":
      return "Leadership diagnostic";
    case "client_fact_pack":
      return "Client Fact Pack";
    default:
      return "Diagnostic";
  }
}

function getQuestionnaireAudienceCopy(
  questionnaireType: ParticipantEmailQuestionnaireType,
): {
  title: string;
  titleShort: string;
  positioning: string;
  purpose: string;
  actionLabel: string;
} {
  switch (questionnaireType) {
    case "hr":
      return {
        title: "HR operations diagnostic",
        titleShort: "HR diagnostic",
        positioning:
          "This diagnostic provides a structured view of how HR services are designed, governed, and delivered across the organisation.",
        purpose:
          "It is designed to support a clear and consistent understanding of current operating practices, helping identify opportunities to strengthen delivery, scalability, and operational clarity over time.",
        actionLabel: "Access HR diagnostic",
      };

    case "manager":
      return {
        title: "manager diagnostic",
        titleShort: "Manager diagnostic",
        positioning:
          "This diagnostic captures how people processes are experienced in day-to-day management.",
        purpose:
          "It helps build a clearer view of how consistently processes are applied in practice and where the manager experience can be further strengthened.",
        actionLabel: "Access manager diagnostic",
      };

    case "leadership":
      return {
        title: "leadership diagnostic",
        titleShort: "Leadership diagnostic",
        positioning:
          "This diagnostic provides a leadership-level view of how people operations support organisational effectiveness and delivery confidence.",
        purpose:
          "It is designed to support informed decisions on how people operations can continue to scale, strengthen delivery, and enable business performance over time.",
        actionLabel: "Access leadership diagnostic",
      };

    case "client_fact_pack":
      return {
        title: "Client Fact Pack",
        titleShort: "Client Fact Pack",
        positioning:
          "This input captures the structural and technical context behind current people operations.",
        purpose:
          "It provides system, tooling, and delivery context that supports interpretation and advisory output, but is not included in scored analysis.",
        actionLabel: "Access Client Fact Pack",
      };

    default:
      return {
        title: "diagnostic",
        titleShort: "Diagnostic",
        positioning:
          "This diagnostic provides a structured view of how people operations are designed, delivered, and experienced.",
        purpose:
          "It is intended to support a clearer understanding of current operations and where service delivery can continue to be strengthened.",
        actionLabel: "Access diagnostic",
      };
  }
}

function getEmailSubject(params: {
  eventType: ParticipantEventEmailType;
  projectName: string;
  questionnaireType: ParticipantEmailQuestionnaireType;
}): string {
  const { eventType, projectName, questionnaireType } = params;
  const label = getQuestionnaireDisplayLabel(questionnaireType);

  switch (eventType) {
    case "invite":
      return `Diagnostic participation request: ${projectName} ${label}`;
    case "invite_extended":
      return `Response window extended: ${projectName} ${label}`;
    case "participant_withdrawn":
      return `Participation update: ${projectName} ${label}`;
    case "participant_reinstated":
      return `Participation restored: ${projectName} ${label}`;
    default:
      return `Update: ${projectName} ${label}`;
  }
}

function buildDetailRow(params: {
  label: string;
  value: string;
}): string {
  const { label, value } = params;

  return `
    <tr>
      <td style="padding:0 0 10px 0;font-size:13px;line-height:1.6;color:#64748b;vertical-align:top;width:155px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:0 0 10px 0;font-size:13px;line-height:1.6;color:#0f172a;vertical-align:top;font-weight:600;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}

function buildDetailsPanel(params: {
  rows: Array<{ label: string; value: string }>;
}): string {
  const rows = params.rows.filter((row) => row.value.trim().length > 0);

  if (rows.length === 0) {
    return "";
  }

  return `
    <div style="margin-top:24px;padding:16px 18px;border:1px solid #dbe3ef;border-radius:8px;background:#f8fafc;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${rows.map(buildDetailRow).join("")}
      </table>
    </div>
  `;
}

function buildEmailShell(params: {
  previewLabel: string;
  heading: string;
  leadHtml: string;
  detailPanelHtml?: string;
  bodyHtml: string;
  ctaHtml?: string;
  footerHtml?: string;
}): string {
  const {
    previewLabel,
    heading,
    leadHtml,
    detailPanelHtml,
    bodyHtml,
    ctaHtml,
    footerHtml,
  } = params;

  return `
    <div style="margin:0;padding:32px 16px;background:#F8FAFC;font-family:Inter,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;">

        <div style="background:#0A1628;padding:22px 30px 20px 30px;border-radius:12px 12px 0 0;">
          <img
            src="https://www.vanesch.uk/brand/van-esch-email-logo.png"
            width="250"
            alt="Van Esch Advisory"
            style="display:block;width:250px;max-width:100%;height:auto;border:0;"
          />
        </div>

        <div style="height:3px;background:#1E6FD9;font-size:0;line-height:0;">&nbsp;</div>

        <div style="border:1px solid #dbe3ef;border-top:0;background:#ffffff;padding:34px 30px 32px 30px;border-radius:0 0 12px 12px;">

          <div style="font-size:11px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;color:#6f8eaa;font-weight:700;">
            ${escapeHtml(previewLabel)}
          </div>

          <div style="margin-top:12px;font-size:28px;line-height:1.2;font-weight:700;color:#0A1628;letter-spacing:-0.02em;">
            ${escapeHtml(heading)}
          </div>

          <div style="margin-top:22px;font-size:15px;line-height:1.8;color:#334155;">
            ${leadHtml}
          </div>

          ${detailPanelHtml ? detailPanelHtml : ""}

          <div style="margin-top:24px;font-size:15px;line-height:1.8;color:#334155;">
            ${bodyHtml}
          </div>

          ${ctaHtml ? `<div style="margin-top:28px;">${ctaHtml}</div>` : ""}

          <div style="margin-top:34px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.8;color:#64748b;">
            ${footerHtml ??
    `Van Esch Advisory Ltd<br/>HR Operations &amp; Transformation Advisory<br/>www.vanesch.uk`
    }
          </div>
        </div>

      </div>
    </div>
  `;
}

function buildButton(params: {
  href: string;
  label: string;
}): string {
  const { href, label } = params;

  return `
    <a
      href="${escapeHtml(href)}"
      style="display:inline-block;padding:13px 20px;background:#1E6FD9;color:#ffffff;text-decoration:none;border-radius:7px;font-weight:600;font-size:14px;letter-spacing:0.01em;"
    >
      ${escapeHtml(label)}
    </a>
  `;
}

function buildInviteEmail(params: {
  name: string;
  projectName: string;
  companyName?: string | null;
  questionnaireType: ParticipantEmailQuestionnaireType;
  inviteUrl: string;
  inviteExpiresAt?: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    name,
    projectName,
    companyName,
    questionnaireType,
    inviteUrl,
    inviteExpiresAt,
  } = params;

  const audienceCopy = getQuestionnaireAudienceCopy(questionnaireType);
  const expiresLabel = formatDate(inviteExpiresAt);
  const organisationLabel = companyName?.trim() || projectName;

  const leadHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      You’ve been invited to contribute to the <strong>${escapeHtml(
    audienceCopy.title,
  )}</strong> for <strong>${escapeHtml(organisationLabel)}</strong>.
    </p>
    <p style="margin:16px 0 0 0;">
      ${escapeHtml(audienceCopy.positioning)}
    </p>
  `;

  const detailPanelHtml = buildDetailsPanel({
    rows: [
      {
        label:
          questionnaireType === "client_fact_pack"
            ? "Input"
            : "Perspective",
        value: audienceCopy.titleShort,
      },
      ...(questionnaireType === "client_fact_pack"
        ? []
        : [
          {
            label: "Time",
            value: "Around 8–10 minutes",
          },
        ]),
      ...(expiresLabel
        ? [
          {
            label: "Respond by",
            value: expiresLabel,
          },
        ]
        : []),
    ],
  });

  const bodyHtml = `
    <p style="margin:0;">
      ${escapeHtml(audienceCopy.purpose)}
    </p>
    ${questionnaireType === "client_fact_pack"
      ? `<p style="margin:16px 0 0 0;">
            This input should be completed once to establish the operating context for this engagement.
          </p>`
      : ""
    }
    <p style="margin:16px 0 0 0;">
      You can pause and return later using the same invitation link.
    </p>
    <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;line-height:1.7;">
      Access is invitation-only. When you open the link, a one-time verification
      code will be sent to this email address.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Diagnostic participation request",
    heading:
      questionnaireType === "client_fact_pack"
        ? "Client Fact Pack request"
        : "Diagnostic participation request",
    leadHtml,
    detailPanelHtml,
    bodyHtml,
    ctaHtml: buildButton({
      href: inviteUrl,
      label: audienceCopy.actionLabel,
    }),
    footerHtml:
      "This message relates to an active diagnostic engagement managed by Van Esch Advisory Ltd.<br/><br/>Van Esch Advisory Ltd<br/>HR Operations &amp; Transformation Advisory<br/>www.vanesch.uk",
  });

  const text = [
    `Hi ${name},`,
    ``,
    `You’ve been invited to contribute to the ${audienceCopy.title} for ${organisationLabel}.`,
    ``,
    audienceCopy.positioning,
    ``,
    `${questionnaireType === "client_fact_pack"
      ? "Input"
      : "Perspective"
    }: ${audienceCopy.titleShort}`,
    questionnaireType === "client_fact_pack"
      ? ""
      : "Time: Around 8–10 minutes",
    expiresLabel ? `Respond by: ${expiresLabel}` : "",
    ``,
    audienceCopy.purpose,
    ``,
    questionnaireType === "client_fact_pack"
      ? "This input should be completed once to establish the operating context for this engagement."
      : "",
    ``,
    `Access link: ${inviteUrl}`,
    ``,
    `You can pause and return later using the same invitation link.`,
    ``,
    `Access is invitation-only. When you open the link, a one-time verification code will be sent to this email address.`,
    ``,
    `Van Esch Advisory`,
    `www.vanesch.uk`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: getEmailSubject({
      eventType: "invite",
      projectName,
      questionnaireType,
    }),
    html,
    text,
  };
}

function buildInviteExtendedEmail(params: {
  name: string;
  projectName: string;
  companyName?: string | null;
  questionnaireType: ParticipantEmailQuestionnaireType;
  inviteUrl: string;
  updatedInviteExpiresAt?: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    name,
    projectName,
    companyName,
    questionnaireType,
    inviteUrl,
    updatedInviteExpiresAt,
  } = params;

  const audienceCopy = getQuestionnaireAudienceCopy(questionnaireType);
  const expiresLabel = formatDate(updatedInviteExpiresAt);
  const organisationLabel = companyName?.trim() || projectName;

  const leadHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      Your response window for the <strong>${escapeHtml(
    audienceCopy.title,
  )}</strong> for <strong>${escapeHtml(organisationLabel)}</strong> has been extended.
    </p>
    <p style="margin:16px 0 0 0;">
      You now have additional time to complete your response.
    </p>
  `;

  const detailPanelHtml = buildDetailsPanel({
    rows: [
      {
        label:
          questionnaireType === "client_fact_pack"
            ? "Input"
            : "Perspective",
        value: audienceCopy.titleShort,
      },
      ...(expiresLabel
        ? [
          {
            label: "Respond by",
            value: expiresLabel,
          },
        ]
        : []),
    ],
  });

  const bodyHtml = `
    <p style="margin:0;">
      Your input remains part of the diagnostic and no previous progress has been lost.
    </p>
    <p style="margin:16px 0 0 0;">
      Continue using the same invitation link below.
    </p>
    <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;line-height:1.7;">
      When you open the link, a one-time verification code will be sent to this
      email address.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Response window extended",
    heading: "Your response window has been extended",
    leadHtml,
    detailPanelHtml,
    bodyHtml,
    ctaHtml: buildButton({
      href: inviteUrl,
      label: audienceCopy.actionLabel,
    }),
  });

  const text = [
    `Hi ${name},`,
    ``,
    `Your response window for the ${audienceCopy.title} for ${organisationLabel} has been extended.`,
    ``,
    `You now have additional time to complete your response.`,
    ``,
    `${questionnaireType === "client_fact_pack"
      ? "Input"
      : "Perspective"
    }: ${audienceCopy.titleShort}`,
    expiresLabel ? `Respond by: ${expiresLabel}` : "",
    ``,
    `Your input remains part of the diagnostic and no previous progress has been lost.`,
    ``,
    `Access link: ${inviteUrl}`,
    ``,
    `When you open the link, a one-time verification code will be sent to this email address.`,
    ``,
    `Van Esch Advisory`,
    `www.vanesch.uk`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: getEmailSubject({
      eventType: "invite_extended",
      projectName,
      questionnaireType,
    }),
    html,
    text,
  };
}

function buildWithdrawnEmail(params: {
  name: string;
  projectName: string;
  companyName?: string | null;
  questionnaireType: ParticipantEmailQuestionnaireType;
  withdrawReasonLabel?: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    name,
    projectName,
    companyName,
    questionnaireType,
    withdrawReasonLabel,
  } = params;

  const audienceCopy = getQuestionnaireAudienceCopy(questionnaireType);
  const organisationLabel = companyName?.trim() || projectName;

  const leadHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      Your participation in the <strong>${escapeHtml(
    audienceCopy.title,
  )}</strong> for <strong>${escapeHtml(organisationLabel)}</strong> has been withdrawn.
    </p>
    <p style="margin:16px 0 0 0;">
      You no longer need to take any action. This update has been made to keep the participant set aligned with the current scope of the engagement.
    </p>
  `;

  const detailPanelHtml = buildDetailsPanel({
    rows: [
      {
        label: "Participation type",
        value: audienceCopy.titleShort,
      },
      ...(withdrawReasonLabel
        ? [
          {
            label: "Recorded reason",
            value: withdrawReasonLabel,
          },
        ]
        : []),
    ],
  });

  const bodyHtml = `
    <p style="margin:0;">
      If you believe this may have been done in error, please reply to this email
      and we’ll be happy to review it with the internal project sponsor at your
      organisation.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Participation update",
    heading: "Your participation has been withdrawn",
    leadHtml,
    detailPanelHtml,
    bodyHtml,
  });

  const text = [
    `Hi ${name},`,
    ``,
    `Your participation in the ${audienceCopy.title} for ${organisationLabel} has been withdrawn.`,
    ``,
    `You no longer need to take any action. This update has been made to keep the participant set aligned with the current scope of the engagement.`,
    ``,
    `Participation type: ${audienceCopy.titleShort}`,
    withdrawReasonLabel ? `Recorded reason: ${withdrawReasonLabel}` : "",
    ``,
    `If you believe this may have been done in error, please reply to this email and we’ll be happy to review it with the internal project sponsor at your organisation.`,
    ``,
    `Van Esch Advisory`,
    `www.vanesch.uk`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: getEmailSubject({
      eventType: "participant_withdrawn",
      projectName,
      questionnaireType,
    }),
    html,
    text,
  };
}

function buildReinstatedEmail(params: {
  name: string;
  projectName: string;
  companyName?: string | null;
  questionnaireType: ParticipantEmailQuestionnaireType;
  inviteUrl: string;
  updatedInviteExpiresAt?: string | null;
  reinstateReasonLabel?: string | null;
}): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    name,
    projectName,
    companyName,
    questionnaireType,
    inviteUrl,
    updatedInviteExpiresAt,
    reinstateReasonLabel,
  } = params;

  const audienceCopy = getQuestionnaireAudienceCopy(questionnaireType);
  const expiresLabel = formatDate(updatedInviteExpiresAt);
  const organisationLabel = companyName?.trim() || projectName;

  const leadHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      Your participation in the <strong>${escapeHtml(
    audienceCopy.title,
  )}</strong> for <strong>${escapeHtml(organisationLabel)}</strong> has been restored.
    </p>
    <p style="margin:16px 0 0 0;">
      You can now continue with your response using the invitation link below.
    </p>
  `;

  const detailPanelHtml = buildDetailsPanel({
    rows: [
      {
        label: "Perspective",
        value: audienceCopy.titleShort,
      },
      ...(expiresLabel
        ? [
          {
            label: "Respond by",
            value: expiresLabel,
          },
        ]
        : []),
      ...(reinstateReasonLabel
        ? [
          {
            label: "Recorded reason",
            value: reinstateReasonLabel,
          },
        ]
        : []),
    ],
  });

  const bodyHtml = `
    <p style="margin:0;">
      If you had already started the diagnostic, any previous progress remains
      available and you can continue from where you left off.
    </p>
    <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;line-height:1.7;">
      When you open the link, a one-time verification code will be sent to this
      email address.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Participation restored",
    heading: "Your participation has been restored",
    leadHtml,
    detailPanelHtml,
    bodyHtml,
    ctaHtml: buildButton({
      href: inviteUrl,
      label: audienceCopy.actionLabel,
    }),
  });

  const text = [
    `Hi ${name},`,
    ``,
    `Your participation in the ${audienceCopy.title} for ${organisationLabel} has been restored.`,
    ``,
    `You can now continue with your response using the invitation link below.`,
    ``,
    `Perspective: ${audienceCopy.titleShort}`,
    expiresLabel ? `Respond by: ${expiresLabel}` : "",
    reinstateReasonLabel ? `Recorded reason: ${reinstateReasonLabel}` : "",
    ``,
    `If you had already started the diagnostic, any previous progress remains available and you can continue from where you left off.`,
    ``,
    `Access link: ${inviteUrl}`,
    ``,
    `When you open the link, a one-time verification code will be sent to this email address.`,
    ``,
    `Van Esch Advisory`,
    `www.vanesch.uk`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: getEmailSubject({
      eventType: "participant_reinstated",
      projectName,
      questionnaireType,
    }),
    html,
    text,
  };
}

function buildParticipantEventEmail(params: {
  eventType: ParticipantEventEmailType;
  name: string;
  projectName: string;
  companyName?: string | null;
  questionnaireType: ParticipantEmailQuestionnaireType;
  inviteUrl?: string;
  inviteExpiresAt?: string | null;
  metadata?: ParticipantEventEmailParams["metadata"];
}): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    eventType,
    name,
    projectName,
    companyName,
    questionnaireType,
    inviteUrl,
    inviteExpiresAt,
    metadata,
  } = params;

  switch (eventType) {
    case "invite":
      if (!inviteUrl) {
        throw new Error("Invite email requires inviteUrl.");
      }

      return buildInviteEmail({
        name,
        projectName,
        companyName,
        questionnaireType,
        inviteUrl,
        inviteExpiresAt,
      });

    case "invite_extended":
      if (!inviteUrl) {
        throw new Error("Invite extension email requires inviteUrl.");
      }

      return buildInviteExtendedEmail({
        name,
        projectName,
        companyName,
        questionnaireType,
        inviteUrl,
        updatedInviteExpiresAt:
          metadata?.updatedInviteExpiresAt ?? inviteExpiresAt ?? null,
      });

    case "participant_withdrawn":
      return buildWithdrawnEmail({
        name,
        projectName,
        companyName,
        questionnaireType,
        withdrawReasonLabel: metadata?.withdrawReasonLabel ?? null,
      });

    case "participant_reinstated":
      if (!inviteUrl) {
        throw new Error("Reinstated email requires inviteUrl.");
      }

      return buildReinstatedEmail({
        name,
        projectName,
        companyName,
        questionnaireType,
        inviteUrl,
        updatedInviteExpiresAt:
          metadata?.updatedInviteExpiresAt ?? inviteExpiresAt ?? null,
        reinstateReasonLabel: metadata?.reinstateReasonLabel ?? null,
      });

    default:
      throw new Error(`Unsupported participant email event type: ${eventType}`);
  }
}

export async function sendParticipantEventEmail(
  params: ParticipantEventEmailParams,
): Promise<ParticipantEventEmailResult> {
  const {
    resend,
    fromEmail,
    replyToEmail,
    siteUrl,
    projectName,
    companyName,
    participant,
    eventType,
    metadata,
  } = params;

  try {
    const needsInviteUrl =
      eventType === "invite" ||
      eventType === "invite_extended" ||
      eventType === "participant_reinstated";

    const inviteUrl =
      needsInviteUrl && participant.inviteToken
        ? `${siteUrl.replace(/\/+$/, "")}${getDiagnosticPath(participant.inviteToken)}`
        : undefined;

    if (needsInviteUrl && !inviteUrl) {
      return {
        email: participant.email,
        success: false,
        resendId: null,
        error: "Missing invite token for participant event email.",
      };
    }

    const emailContent = buildParticipantEventEmail({
      eventType,
      name: participant.name,
      projectName,
      companyName,
      questionnaireType: participant.questionnaireType,
      inviteUrl,
      inviteExpiresAt: participant.inviteExpiresAt ?? null,
      metadata,
    });

    const resendResponse = await resend.emails.send({
      from: `Van Esch Advisory <${fromEmail}>`,
      to: participant.email,
      replyTo: replyToEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    const resendError =
      resendResponse && "error" in resendResponse
        ? resendResponse.error
        : null;

    const resendData =
      resendResponse && "data" in resendResponse ? resendResponse.data : null;

    if (resendError) {
      console.error("Resend returned an error", {
        participantEmail: participant.email,
        eventType,
        resendError,
      });

      return {
        email: participant.email,
        success: false,
        resendId: null,
        error:
          typeof resendError.message === "string"
            ? resendError.message
            : "Resend returned an error.",
      };
    }

    console.info("Participant event email accepted by Resend", {
      participantEmail: participant.email,
      eventType,
      resendId: resendData?.id ?? null,
      questionnaireType: participant.questionnaireType,
      inviteExpiresAt: participant.inviteExpiresAt ?? null,
    });

    return {
      email: participant.email,
      success: true,
      resendId: resendData?.id ?? null,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown participant email error.";

    console.error("Participant event email threw an exception", {
      participantEmail: params.participant.email,
      eventType: params.eventType,
      error: message,
    });

    return {
      email: params.participant.email,
      success: false,
      resendId: null,
      error: message,
    };
  }
}
export type ParticipantOtpEmailParams = {
  resend: Resend;
  fromEmail: string;
  replyToEmail: string;
  participantName?: string | null;
  participantEmail: string;
  otpCode: string;
  expiresInMinutes?: number;
};

export async function sendParticipantOtpEmail(
  params: ParticipantOtpEmailParams,
): Promise<ParticipantEventEmailResult> {
  const {
    resend,
    fromEmail,
    replyToEmail,
    participantName,
    participantEmail,
    otpCode,
    expiresInMinutes = 10,
  } = params;

  const name = participantName?.trim() || "there";

  const leadHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      Enter the verification code below to continue to your Van Esch Advisory
      diagnostic.
    </p>
  `;

  const bodyHtml = `
    <div
      style="
        margin:24px 0;
        padding:20px 22px;
        border:1px solid #dbe3ef;
        border-radius:8px;
        background:#f8fafc;
        text-align:center;
      "
    >
      <div
        style="
          font-size:11px;
          line-height:1.5;
          color:#64748b;
          text-transform:uppercase;
          letter-spacing:0.16em;
          font-weight:700;
        "
      >
        Verification code
      </div>

      <div
        style="
          margin-top:10px;
          font-size:36px;
          line-height:1.2;
          color:#0A1628;
          font-weight:700;
          letter-spacing:0.2em;
        "
      >
        ${escapeHtml(otpCode)}
      </div>
    </div>

    <p style="margin:0;">
      This code expires in ${expiresInMinutes} minutes and can only be used once.
    </p>

    <p style="margin:16px 0 0 0;">
  If you did not request this code, do not use it. Please reply to this email
  to let us know so that we can investigate it further.
</p>

    <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;line-height:1.7;">
  Keep this code private. No Van Esch Advisory employee or representative will
  ask you to disclose or forward a verification code by email, telephone, or
  any other channel.
</p>
  `;

  const html = buildEmailShell({
    previewLabel: "Secure diagnostic access",
    heading: "Your verification code",
    leadHtml,
    bodyHtml,
    footerHtml:
      "This message relates to secure access to a diagnostic engagement managed by Van Esch Advisory Ltd.<br/><br/>Van Esch Advisory Ltd<br/>HR Operations &amp; Transformation Advisory<br/>www.vanesch.uk",
  });

  const text = [
    `Hi ${name},`,
    "",
    "Enter the verification code below to continue to your Van Esch Advisory diagnostic.",
    "",
    `Verification code: ${otpCode}`,
    "",
    `This code expires in ${expiresInMinutes} minutes and can only be used once.`,
    "",
    "If you did not request this code, do not use it. Please reply to this email to let us know so that we can investigate it further.",
    "",
    "Keep this code private. No Van Esch Advisory employee or representative will ask you to disclose or forward a verification code by email, telephone, or any other channel.",
    "",
    "Van Esch Advisory",
    "www.vanesch.uk",
  ].join("\n");

  try {
    const resendResponse = await resend.emails.send({
      from: `Van Esch Advisory <${fromEmail}>`,
      to: participantEmail,
      replyTo: replyToEmail,
      subject: "Your Van Esch Advisory verification code",
      html,
      text,
    });

    const resendError =
      resendResponse && "error" in resendResponse
        ? resendResponse.error
        : null;

    const resendData =
      resendResponse && "data" in resendResponse
        ? resendResponse.data
        : null;

    if (resendError) {
      console.error("Resend returned an OTP email error", {
        eventType: "participant_email_otp",
        resendError,
      });

      return {
        email: participantEmail,
        success: false,
        resendId: null,
        error:
          typeof resendError.message === "string"
            ? resendError.message
            : "Resend returned an error.",
      };
    }

    console.info("Participant OTP email accepted by Resend", {
      eventType: "participant_email_otp",
      resendId: resendData?.id ?? null,
    });

    return {
      email: participantEmail,
      success: true,
      resendId: resendData?.id ?? null,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown participant OTP email error.";

    console.error("Participant OTP email threw an exception", {
      eventType: "participant_email_otp",
      error: message,
    });

    return {
      email: participantEmail,
      success: false,
      resendId: null,
      error: message,
    };
  }
}
