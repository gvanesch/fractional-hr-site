import { NextResponse } from "next/server";
import { verifyCloudflareAdvisorAccessToken } from "@/lib/cloudflare-access";

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;

  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1"
  );
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";

  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeJson(value: unknown): string {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function createToken(params: {
  audience: string;
  email: string;
  expiresAt: number;
  issuedAfter: number;
  keyId: string;
  privateKey: CryptoKey;
  teamDomain: string;
}): Promise<string> {
  const header = encodeJson({ alg: "RS256", kid: params.keyId, typ: "JWT" });
  const payload = encodeJson({
    aud: [params.audience],
    email: params.email,
    exp: params.expiresAt,
    iss: params.teamDomain,
    nbf: params.issuedAfter,
    sub: "cloudflare-access-runtime-probe",
  });
  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    params.privateKey,
    signingInput,
  );

  return `${header}.${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

async function rejects(operation: () => Promise<unknown>): Promise<boolean> {
  try {
    await operation();
    return false;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const keyId = crypto.randomUUID();
    const teamDomain = "https://runtime-probe.cloudflareaccess.com";
    const audience = "runtime-probe-audience";
    const now = Math.floor(Date.now() / 1000);
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const signingKey = {
      ...publicJwk,
      alg: "RS256",
      kid: keyId,
      use: "sig",
    };
    const token = await createToken({
      audience,
      email: "advisor@example.com",
      expiresAt: now + 300,
      issuedAfter: now - 1,
      keyId,
      privateKey: keyPair.privateKey,
      teamDomain,
    });
    const verified = await verifyCloudflareAdvisorAccessToken({
      audience,
      nowSeconds: now,
      signingKey,
      teamDomain,
      token,
    });

    if (verified.email !== "advisor@example.com") {
      throw new Error("Valid Cloudflare Access token was not accepted.");
    }

    const wrongAudienceRejected = await rejects(() =>
      verifyCloudflareAdvisorAccessToken({
        audience: "wrong-audience",
        nowSeconds: now,
        signingKey,
        teamDomain,
        token,
      }),
    );
    const expiredRejected = await rejects(() =>
      verifyCloudflareAdvisorAccessToken({
        audience,
        nowSeconds: now + 301,
        signingKey,
        teamDomain,
        token,
      }),
    );
    const tamperedRejected = await rejects(() =>
      verifyCloudflareAdvisorAccessToken({
        audience,
        nowSeconds: now,
        signingKey,
        teamDomain,
        token: `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`,
      }),
    );

    if (!wrongAudienceRejected || !expiredRejected || !tamperedRejected) {
      throw new Error("Cloudflare Access rejection controls did not pass.");
    }

    return NextResponse.json({
      status: "ok",
      cloudflareAccess: {
        validToken: "passed",
        wrongAudience: "passed",
        expiredToken: "passed",
        tamperedToken: "passed",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
