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
    <div style="margin-top:24px;padding:18px 20px;border:1px solid #dbe3ef;border-radius:16px;background:#f8fafc;">
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
    <div style="margin:0;padding:36px 16px;background:#F4F6FA;font-family:Inter,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;">
        <div style="overflow:hidden;border:1px solid #d6e0eb;border-radius:24px;background:#ffffff;box-shadow:0 8px 30px rgba(15,23,42,0.06);">
          <div style="padding:26px 30px;background:linear-gradient(135deg,#0A1628 0%,#0D1F3C 100%);">
            <div style="font-size:11px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;color:#8AAAC8;font-weight:700;">
              ${escapeHtml(previewLabel)}
            </div>

            <div style="margin-top:14px;font-size:30px;line-height:1.1;color:#ffffff;font-weight:700;">
              Van Esch
            </div>

            <div style="margin-top:8px;font-size:14px;line-height:1.7;color:#d4dfeb;">
              HR Operations &amp; Transformation Advisory
            </div>
          </div>

          <div style="padding:34px 30px 32px 30px;">
            <div style="font-size:28px;line-height:1.2;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">
              ${escapeHtml(heading)}
            </div>

            <div style="margin-top:22px;font-size:15px;line-height:1.9;color:#334155;">
              ${leadHtml}
            </div>

            ${detailPanelHtml ? detailPanelHtml : ""}

            <div style="margin-top:24px;font-size:15px;line-height:1.9;color:#334155;">
              ${bodyHtml}
            </div>

            ${ctaHtml ? `<div style="margin-top:30px;">${ctaHtml}</div>` : ""}

            <div style="margin-top:34px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.9;color:#64748b;">
              ${
                footerHtml ??
                `Van Esch Advisory Ltd<br/>HR Operations &amp; Transformation Advisory<br/>www.vanesch.uk`
              }
            </div>
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
      style="display:inline-block;padding:14px 20px;background:#1E6FD9;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;letter-spacing:0.01em;"
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
        label: "Participation type",
        value: audienceCopy.titleShort,
      },
      ...(expiresLabel
        ? [
            {
              label: "Response window",
              value: `Please respond by ${expiresLabel}`,
            },
          ]
        : []),
    ],
  });

  const bodyHtml = `
    <p style="margin:0;">
      ${escapeHtml(audienceCopy.purpose)}
    </p>
    <p style="margin:16px 0 0 0;">
      ${
        questionnaireType === "client_fact_pack"
          ? "This input should be completed once to establish the operating context for this engagement."
          : "The diagnostic typically takes around 8 to 10 minutes to complete."
      }
    </p>
    <p style="margin:16px 0 0 0;">
      You can return to the same link if you need to pause and continue later.
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
    `Participation type: ${audienceCopy.titleShort}`,
    expiresLabel ? `Response window: Please respond by ${expiresLabel}` : "",
    ``,
    audienceCopy.purpose,
    ``,
    questionnaireType === "client_fact_pack"
      ? "This input should be completed once to establish the operating context for this engagement."
      : "The diagnostic typically takes around 8 to 10 minutes to complete.",
    ``,
    `Access link: ${inviteUrl}`,
    ``,
    `You can return to the same link if you need to pause and continue later.`,
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
      This is to ensure your perspective can still be included in the active diagnostic collection.
    </p>
  `;

  const detailPanelHtml = buildDetailsPanel({
    rows: [
      {
        label: "Participation type",
        value: audienceCopy.titleShort,
      },
      ...(expiresLabel
        ? [
            {
              label: "Updated response window",
              value: `Please respond by ${expiresLabel}`,
            },
          ]
        : []),
    ],
  });

  const bodyHtml = `
    <p style="margin:0;">
      Your input remains an important part of building a complete and balanced view of current operations.
    </p>
    <p style="margin:16px 0 0 0;">
      You can continue using the same link below.
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
    `This is to ensure your perspective can still be included in the active diagnostic collection.`,
    ``,
    `Participation type: ${audienceCopy.titleShort}`,
    expiresLabel ? `Updated response window: Please respond by ${expiresLabel}` : "",
    ``,
    `Your input remains an important part of building a complete and balanced view of current operations.`,
    ``,
    `Access link: ${inviteUrl}`,
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
      If you believe this update has been made in error, please reply to this email so it can be reviewed.
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
    `If you believe this update has been made in error, please reply to this email so it can be reviewed.`,
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
      Your perspective is once again included in the active diagnostic collection for this engagement.
    </p>
  `;

  const detailPanelHtml = buildDetailsPanel({
    rows: [
      {
        label: "Participation type",
        value: audienceCopy.titleShort,
      },
      ...(expiresLabel
        ? [
            {
              label: "Response window",
              value: `Please respond by ${expiresLabel}`,
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
      Please use the link below to access and complete your response.
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
    `Your perspective is once again included in the active diagnostic collection for this engagement.`,
    ``,
    `Participation type: ${audienceCopy.titleShort}`,
    expiresLabel ? `Response window: Please respond by ${expiresLabel}` : "",
    reinstateReasonLabel ? `Recorded reason: ${reinstateReasonLabel}` : "",
    ``,
    `Please use the link below to access and complete your response.`,
    ``,
    `Access link: ${inviteUrl}`,
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