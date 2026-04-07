export function getAllowedAdvisorEmails(): string[] {
  return (process.env.ADVISOR_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdvisorEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const allowedEmails = getAllowedAdvisorEmails();
  const normalizedEmail = email.trim().toLowerCase();

  return allowedEmails.includes(normalizedEmail);
}