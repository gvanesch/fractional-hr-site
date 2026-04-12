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

function getDiagnosticPath(
  inviteToken: string,
): string {
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
  purpose: string;
  actionLabel: string;
} {
  switch (questionnaireType) {
    case "hr":
      return {
        title: "HR operations diagnostic",
        purpose:
          "This version focuses on operational structure, service delivery, controls, and how HR services are designed and run.",
        actionLabel: "Start HR diagnostic",
      };
    case "manager":
      return {
        title: "Manager diagnostic",
        purpose:
          "This version focuses on how HR processes are experienced in practice, including clarity, responsiveness, and day-to-day delivery.",
        actionLabel: "Start manager diagnostic",
      };
    case "leadership":
      return {
        title: "Leadership diagnostic",
        purpose:
          "This version focuses on organisational effectiveness, operating discipline, and how people operations support business performance.",
        actionLabel: "Start leadership diagnostic",
      };
    case "client_fact_pack":
      return {
        title: "Client Fact Pack",
        purpose:
          "This captures contextual information on systems, tooling, infrastructure, and delivery environment. It supports final interpretation, but is not included in scored statistical analysis.",
        actionLabel: "Start fact pack",
      };
    default:
      return {
        title: "Diagnostic",
        purpose:
          "This diagnostic is used to assess how HR operations are designed, delivered, and experienced across the organisation.",
        actionLabel: "Open diagnostic",
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
      return `Input requested: ${projectName} ${label}`;
    case "invite_extended":
      return `Completion window updated: ${projectName} ${label}`;
    case "participant_withdrawn":
      return `Participation update: ${projectName} ${label}`;
    case "participant_reinstated":
      return `Participation reinstated: ${projectName} ${label}`;
    default:
      return `Update: ${projectName} ${label}`;
  }
}

function buildEmailShell(params: {
  previewLabel: string;
  heading: string;
  introHtml: string;
  bodyHtml: string;
  ctaHtml?: string;
  footerHtml?: string;
}): string {
  const { previewLabel, heading, introHtml, bodyHtml, ctaHtml, footerHtml } =
    params;

  return `
    <div style="margin:0;padding:32px 16px;background:#F4F6FA;font-family:Inter,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:20px;overflow:hidden;">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#0A1628 0%,#0D1F3C 100%);">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8AAAC8;font-weight:700;">
            ${escapeHtml(previewLabel)}
          </div>
          <div style="margin-top:10px;font-size:28px;line-height:1.2;color:#ffffff;font-weight:700;">
            Van Esch
          </div>
          <div style="margin-top:6px;font-size:14px;line-height:1.6;color:#c7d6e6;">
            HR Operations &amp; Transformation Advisory
          </div>
        </div>

        <div style="padding:32px 28px;">
          <div style="font-size:24px;line-height:1.3;font-weight:700;color:#0f172a;">
            ${escapeHtml(heading)}
          </div>

          <div style="margin-top:20px;font-size:15px;line-height:1.8;color:#334155;">
            ${introHtml}
          </div>

          <div style="margin-top:20px;font-size:15px;line-height:1.8;color:#334155;">
            ${bodyHtml}
          </div>

          ${ctaHtml ? `<div style="margin-top:28px;">${ctaHtml}</div>` : ""}

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:14px;line-height:1.8;color:#475569;">
            ${
              footerHtml ??
              `Van Esch Advisory Ltd<br/>HR Operations &amp; Transformation Advisory`
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
      style="display:inline-block;padding:13px 18px;background:#1E6FD9;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;"
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

  const introHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      You’ve been asked to contribute to the <strong>${escapeHtml(
        audienceCopy.title,
      )}</strong> for <strong>${escapeHtml(organisationLabel)}</strong>.
    </p>
  `;

  const bodyHtml = `
    <p style="margin:0;">
      ${escapeHtml(audienceCopy.purpose)}
    </p>
    <p style="margin:16px 0 0 0;">
      Your input will be combined with other perspectives to identify where processes are working, where they are inconsistent, and where operational friction exists.
    </p>
    <p style="margin:16px 0 0 0;">
      <strong>${
        questionnaireType === "client_fact_pack"
          ? "This input should only be completed once for the project."
          : "The questionnaire takes around 8 to 10 minutes to complete."
      }</strong>
    </p>
    ${
      expiresLabel
        ? `<p style="margin:16px 0 0 0;"><strong>Completion window:</strong> please respond by ${escapeHtml(
            expiresLabel,
          )}.</p>`
        : ""
    }
    <p style="margin:16px 0 0 0;">
      If you need to pause, you can return to the same link at any time.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Participation request",
    heading: audienceCopy.title,
    introHtml,
    bodyHtml,
    ctaHtml: buildButton({
      href: inviteUrl,
      label: audienceCopy.actionLabel,
    }),
    footerHtml:
      "Thank you for your input.<br/><br/>Van Esch Advisory Ltd<br/>HR Operations &amp; Transformation Advisory",
  });

  const text = [
    `Hi ${name},`,
    ``,
    `You’ve been asked to contribute to the ${audienceCopy.title} for ${organisationLabel}.`,
    ``,
    audienceCopy.purpose,
    ``,
    `Your input will be combined with other perspectives to identify where processes are working, where they are inconsistent, and where operational friction exists.`,
    ``,
    questionnaireType === "client_fact_pack"
      ? "This input should only be completed once for the project."
      : "The questionnaire takes around 8 to 10 minutes to complete.",
    expiresLabel ? `Completion window: please respond by ${expiresLabel}.` : "",
    ``,
    `Access link: ${inviteUrl}`,
    ``,
    `If you need to pause, you can return to the same link at any time.`,
    ``,
    `Thank you,`,
    `Van Esch Advisory`,
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

  const introHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      Additional time has been provided for your <strong>${escapeHtml(
        audienceCopy.title,
      )}</strong> response for <strong>${escapeHtml(organisationLabel)}</strong>.
    </p>
  `;

  const bodyHtml = `
    <p style="margin:0;">
      Your participation is still active, and your input remains important to the final diagnostic picture.
    </p>
    ${
      expiresLabel
        ? `<p style="margin:16px 0 0 0;"><strong>Updated completion window:</strong> please respond by ${escapeHtml(
            expiresLabel,
          )}.</p>`
        : ""
    }
    <p style="margin:16px 0 0 0;">
      You can continue using the same link below.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Completion window updated",
    heading: "Additional time has been provided",
    introHtml,
    bodyHtml,
    ctaHtml: buildButton({
      href: inviteUrl,
      label: audienceCopy.actionLabel,
    }),
  });

  const text = [
    `Hi ${name},`,
    ``,
    `Additional time has been provided for your ${audienceCopy.title} response for ${organisationLabel}.`,
    ``,
    `Your participation is still active, and your input remains important to the final diagnostic picture.`,
    expiresLabel ? `Updated completion window: please respond by ${expiresLabel}.` : "",
    ``,
    `Access link: ${inviteUrl}`,
    ``,
    `You can continue using the same link below.`,
    ``,
    `Van Esch Advisory`,
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
}): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, projectName, companyName, questionnaireType } = params;
  const audienceCopy = getQuestionnaireAudienceCopy(questionnaireType);
  const organisationLabel = companyName?.trim() || projectName;

  const introHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      Your participation in the <strong>${escapeHtml(
        audienceCopy.title,
      )}</strong> for <strong>${escapeHtml(organisationLabel)}</strong> has been withdrawn.
    </p>
  `;

  const bodyHtml = `
    <p style="margin:0;">
      This means you no longer need to complete the diagnostic, and your participation will not be included in the active collection set.
    </p>
    <p style="margin:16px 0 0 0;">
      If you believe this has been sent in error, please reply to this email or contact the project sponsor.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Participation update",
    heading: "Your participation has been withdrawn",
    introHtml,
    bodyHtml,
  });

  const text = [
    `Hi ${name},`,
    ``,
    `Your participation in the ${audienceCopy.title} for ${organisationLabel} has been withdrawn.`,
    ``,
    `This means you no longer need to complete the diagnostic, and your participation will not be included in the active collection set.`,
    ``,
    `If you believe this has been sent in error, please reply to this email or contact the project sponsor.`,
    ``,
    `Van Esch Advisory`,
  ].join("\n");

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

  const introHtml = `
    <p style="margin:0;">Hi ${escapeHtml(name)},</p>
    <p style="margin:16px 0 0 0;">
      Your participation in the <strong>${escapeHtml(
        audienceCopy.title,
      )}</strong> for <strong>${escapeHtml(organisationLabel)}</strong> has been reinstated.
    </p>
  `;

  const bodyHtml = `
    <p style="margin:0;">
      You can now access and complete the diagnostic again. Your response will be included in the active collection set and final analysis.
    </p>
    ${
      expiresLabel
        ? `<p style="margin:16px 0 0 0;"><strong>Updated completion window:</strong> please respond by ${escapeHtml(
            expiresLabel,
          )}.</p>`
        : ""
    }
    <p style="margin:16px 0 0 0;">
      Please use the link below to continue.
    </p>
  `;

  const html = buildEmailShell({
    previewLabel: "Participation reinstated",
    heading: "Your participation has been reinstated",
    introHtml,
    bodyHtml,
    ctaHtml: buildButton({
      href: inviteUrl,
      label: audienceCopy.actionLabel,
    }),
  });

  const text = [
    `Hi ${name},`,
    ``,
    `Your participation in the ${audienceCopy.title} for ${organisationLabel} has been reinstated.`,
    ``,
    `You can now access and complete the diagnostic again. Your response will be included in the active collection set and final analysis.`,
    expiresLabel ? `Updated completion window: please respond by ${expiresLabel}.` : "",
    ``,
    `Access link: ${inviteUrl}`,
    ``,
    `Please use the link below to continue.`,
    ``,
    `Van Esch Advisory`,
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