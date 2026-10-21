import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

type AccessJwtHeader = {
  alg?: unknown;
  kid?: unknown;
};

type AccessJwtPayload = {
  aud?: unknown;
  email?: unknown;
  exp?: unknown;
  iss?: unknown;
  nbf?: unknown;
  sub?: unknown;
};

type AccessJwk = JsonWebKey & {
  alg?: string;
  kid?: string;
  kty?: string;
  use?: string;
};

type AccessJwksResponse = {
  keys?: AccessJwk[];
};

export type AdvisorAccessUser = {
  email: string;
  id: string;
};

let cachedKeys:
  | {
      expiresAt: number;
      teamDomain: string;
      keys: AccessJwk[];
    }
  | undefined;

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const decoded = atob(padded);
  const bytes = new Uint8Array(decoded.length);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return bytes;
}

function decodeJsonPart<T>(value: string): T {
  const bytes = decodeBase64Url(value);
  const decoded = new TextDecoder().decode(bytes);

  return JSON.parse(decoded) as T;
}

function getAccessConfiguration(): {
  audience: string;
  teamDomain: string;
} {
  const audience = process.env.CLOUDFLARE_ACCESS_AUD?.trim();
  const configuredTeamDomain =
    process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN?.trim();

  if (!audience || !configuredTeamDomain) {
    throw new Error("Cloudflare Access configuration is incomplete.");
  }

  const teamDomain = configuredTeamDomain.replace(/\/$/, "");
  const parsedTeamDomain = new URL(teamDomain);

  if (
    parsedTeamDomain.protocol !== "https:" ||
    parsedTeamDomain.pathname !== "/" ||
    parsedTeamDomain.search ||
    parsedTeamDomain.hash ||
    !parsedTeamDomain.hostname.endsWith(".cloudflareaccess.com")
  ) {
    throw new Error("Cloudflare Access team domain is invalid.");
  }

  return { audience, teamDomain };
}

async function fetchAccessKeys(
  teamDomain: string,
  forceRefresh = false,
): Promise<AccessJwk[]> {
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedKeys &&
    cachedKeys.teamDomain === teamDomain &&
    cachedKeys.expiresAt > now
  ) {
    return cachedKeys.keys;
  }

  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to load Cloudflare Access signing keys.");
  }

  const payload = (await response.json()) as AccessJwksResponse;
  const keys = Array.isArray(payload.keys)
    ? payload.keys.filter(
        (key) =>
          key &&
          key.kty === "RSA" &&
          key.alg === "RS256" &&
          typeof key.kid === "string",
      )
    : [];

  if (keys.length === 0) {
    throw new Error("Cloudflare Access did not return usable signing keys.");
  }

  cachedKeys = {
    expiresAt: now + 10 * 60 * 1000,
    teamDomain,
    keys,
  };

  return keys;
}

async function getSigningKey(
  teamDomain: string,
  keyId: string,
): Promise<AccessJwk> {
  let keys = await fetchAccessKeys(teamDomain);
  let key = keys.find((candidate) => candidate.kid === keyId);

  if (!key) {
    keys = await fetchAccessKeys(teamDomain, true);
    key = keys.find((candidate) => candidate.kid === keyId);
  }

  if (!key) {
    throw new Error("Cloudflare Access signing key was not found.");
  }

  return key;
}

function audienceMatches(audienceClaim: unknown, audience: string): boolean {
  if (typeof audienceClaim === "string") {
    return audienceClaim === audience;
  }

  return (
    Array.isArray(audienceClaim) &&
    audienceClaim.some((value) => value === audience)
  );
}

export function isCloudflareAdvisorAuthEnabled(): boolean {
  return process.env.ADVISOR_AUTH_MODE === "cloudflare_access";
}

function parseToken(token: string): {
  header: AccessJwtHeader;
  parts: string[];
  payload: AccessJwtPayload;
} {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Cloudflare Access token is malformed.");
  }

  const header = decodeJsonPart<AccessJwtHeader>(parts[0]);
  const payload = decodeJsonPart<AccessJwtPayload>(parts[1]);

  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Cloudflare Access token header is invalid.");
  }

  return { header, parts, payload };
}

export async function verifyCloudflareAdvisorAccessToken(params: {
  allowedEmails?: readonly string[];
  audience: string;
  nowSeconds?: number;
  signingKey: AccessJwk;
  teamDomain: string;
  token: string;
}): Promise<AdvisorAccessUser> {
  const { audience, signingKey, teamDomain, token } = params;
  const { header, parts, payload } = parseToken(token);

  if (signingKey.kid !== header.kid) {
    throw new Error("Cloudflare Access signing key does not match token.");
  }

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    signingKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = decodeBase64Url(parts[2]);
  const signatureValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    Uint8Array.from(signature).buffer,
    Uint8Array.from(signingInput).buffer,
  );

  if (!signatureValid) {
    throw new Error("Cloudflare Access token signature is invalid.");
  }

  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (
    payload.iss !== teamDomain ||
    !audienceMatches(payload.aud, audience) ||
    typeof payload.exp !== "number" ||
    payload.exp <= now ||
    (typeof payload.nbf === "number" && payload.nbf > now + 60)
  ) {
    throw new Error("Cloudflare Access token claims are invalid.");
  }

  const email =
    typeof payload.email === "string" ? payload.email.toLowerCase() : "";

  const emailAllowed = params.allowedEmails
    ? params.allowedEmails.some(
        (allowedEmail) => allowedEmail.trim().toLowerCase() === email,
      )
    : isAllowedAdvisorEmail(email);

  if (!email || !emailAllowed) {
    throw new Error("Cloudflare Access user is not an allowed advisor.");
  }

  return {
    email,
    id: typeof payload.sub === "string" ? payload.sub : email,
  };
}

export async function verifyCloudflareAdvisorAccess(
  requestHeaders: Headers,
): Promise<AdvisorAccessUser> {
  const token = requestHeaders.get("cf-access-jwt-assertion")?.trim();

  if (!token) {
    throw new Error("Cloudflare Access token is missing.");
  }

  const { header } = parseToken(token);
  const { audience, teamDomain } = getAccessConfiguration();
  const signingKey = await getSigningKey(teamDomain, header.kid as string);

  return verifyCloudflareAdvisorAccessToken({
    audience,
    signingKey,
    teamDomain,
    token,
  });
}
