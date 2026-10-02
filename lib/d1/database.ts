import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1MigrationEnv = CloudflareEnv & {
  D1_CRM_PROSPECTS_MODE?: string;
  D1_CLIENT_DIAGNOSTIC_MODE?: string;
  D1_CLIENT_DIAGNOSTIC_SECURITY_MODE?: string;
  D1_DIAGNOSTIC_SUBMISSIONS_MODE?: string;
};

export function getD1Database(): D1Database {
  return getCloudflareContext().env.DB;
}

export function isD1CrmProspectsShadowWriteEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_CRM_PROSPECTS_MODE === "shadow";
  } catch {
    return false;
  }
}

export function isD1CrmProspectsEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_CRM_PROSPECTS_MODE === "d1";
  } catch {
    return false;
  }
}

export function isD1DiagnosticSubmissionsShadowWriteEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_DIAGNOSTIC_SUBMISSIONS_MODE === "shadow";
  } catch {
    return false;
  }
}

export function isD1DiagnosticSubmissionsEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_DIAGNOSTIC_SUBMISSIONS_MODE === "d1";
  } catch {
    return false;
  }
}

export function isD1ClientDiagnosticShadowWriteEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_CLIENT_DIAGNOSTIC_MODE === "shadow";
  } catch {
    return false;
  }
}

export function isD1ClientDiagnosticWriteEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_CLIENT_DIAGNOSTIC_MODE === "d1";
  } catch {
    return false;
  }
}

export const isD1ClientDiagnosticEnabled =
  isD1ClientDiagnosticWriteEnabled;

export function isD1ClientDiagnosticSecurityEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_CLIENT_DIAGNOSTIC_SECURITY_MODE === "d1";
  } catch {
    return false;
  }
}
