export type AppEnvironment = "production" | "qa" | "local";

const PRODUCTION_SUPABASE_PROJECT_REF = "qxddddhhpfrrxbaunwfw";
const QA_SUPABASE_PROJECT_REF = "lrlapaiyejvbckqpbrwa";

function getRequiredPublicEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppEnvironment(): AppEnvironment {
  const value = getRequiredPublicEnv("NEXT_PUBLIC_APP_ENV").trim().toLowerCase();

  if (value === "production" || value === "qa" || value === "local") {
    return value;
  }

  throw new Error(
    `Invalid NEXT_PUBLIC_APP_ENV: ${value}. Expected production, qa or local.`,
  );
}

export function getSupabaseProjectRef(url: string): string {
  let hostname: string;

  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);

  if (!match) {
    throw new Error(
      `Unsupported Supabase hostname: ${hostname}. Expected <project-ref>.supabase.co.`,
    );
  }

  return match[1];
}

export function assertSupabaseEnvironment(url: string): {
  appEnvironment: AppEnvironment;
  projectRef: string;
} {
  const appEnvironment = getAppEnvironment();
  const projectRef = getSupabaseProjectRef(url);

  if (
    appEnvironment === "production" &&
    projectRef !== PRODUCTION_SUPABASE_PROJECT_REF
  ) {
    throw new Error(
      "Supabase environment mismatch: production application is not connected to the production Supabase project.",
    );
  }

  if (
    (appEnvironment === "qa" || appEnvironment === "local") &&
    projectRef !== QA_SUPABASE_PROJECT_REF
  ) {
    throw new Error(
      "Supabase environment mismatch: QA/local application is not connected to the QA Supabase project.",
    );
  }

  return { appEnvironment, projectRef };
}

export function getValidatedSupabaseUrl(): string {
  const url = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  assertSupabaseEnvironment(url);
  return url;
}

export function isQaLikeEnvironment(): boolean {
  const environment = getAppEnvironment();
  return environment === "qa" || environment === "local";
}
