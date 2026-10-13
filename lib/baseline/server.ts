import { rosterMetadata, CORE_ROSTER_FIELDS } from "./roster-fields";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { Resend } from "resend";
import {
  AREAS,
  QUESTIONNAIRE,
  VERSION,
  PRIVACY,
  areaPillar,
  initialDraft,
  parseDraft,
  completionError,
  pillar,
  parseRoster,
  toCsv,
  type Draft,
  type Profile,
  type EntityOption,
} from "./model";

type Env = CloudflareEnv & {
  BASELINE_ENABLED?: string;
  BASELINE_MAIL_MODE?: string;
  NEXT_PUBLIC_APP_ENV?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  INVITE_RATE_LIMIT_SALT?: string;
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
  D1_SYSTEM_EVENTS_MODE?: string;
  D1_CRM_PROSPECTS_MODE?: string;
  D1_DIAGNOSTIC_SUBMISSIONS_MODE?: string;
  D1_CLIENT_DIAGNOSTIC_MODE?: string;
  D1_CLIENT_DIAGNOSTIC_SECURITY_MODE?: string;
};
export class BaselineError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const COOKIE = "__Host-tb_baseline";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const now = () => new Date().toISOString();
export function baselineEnv(): Env {
  const env = getCloudflareContext().env as Env;
  if (env.BASELINE_ENABLED !== "true")
    throw new BaselineError("This assessment is not available.", 404);
  if (
    env.NEXT_PUBLIC_APP_ENV !== "qa" &&
    [
      env.D1_SYSTEM_EVENTS_MODE,
      env.D1_CRM_PROSPECTS_MODE,
      env.D1_DIAGNOSTIC_SUBMISSIONS_MODE,
      env.D1_CLIENT_DIAGNOSTIC_MODE,
      env.D1_CLIENT_DIAGNOSTIC_SECURITY_MODE,
    ].some((mode) => mode !== "d1")
  )
    throw new BaselineError("This assessment is not available.", 404);
  return env;
}
const db = () => baselineEnv().DB;
export const securityHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new BaselineError(
      "Please open the assessment on this website and try again.",
      403,
    );
}
export async function readBody(
  request: Request,
  limit = 75000,
): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new BaselineError("Use a JSON request.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new BaselineError("No answers were received.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new BaselineError("Please shorten the request.", 413);
    }
    chunks.push(value);
  }
  let text = "";
  const decoder = new TextDecoder();
  for (const chunk of chunks) text += decoder.decode(chunk, { stream: true });
  text += decoder.decode();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BaselineError("Please check the request.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new BaselineError("Please check the request.");
  return parsed;
}
export async function audit(
  actor: string,
  action: string,
  campaign: string | null,
  subject: string | null,
  metadata: Record<string, unknown> = {},
) {
  await db()
    .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
    .bind(
      randomUUID(),
      campaign,
      actor,
      action,
      subject,
      JSON.stringify(metadata),
      now(),
    )
    .run();
}
export async function admin() {
  baselineEnv();
  const user = await requireAdvisorUser();
  if (!user?.email)
    throw new BaselineError("Administrator access is required.", 403);
  return user.email.toLowerCase();
}
export async function rateLimit(
  request: Request,
  context: string,
  maximum = 20,
) {
  const env = baselineEnv();
  if (!env.INVITE_RATE_LIMIT_SALT)
    throw new BaselineError("Secure access is temporarily unavailable.", 503);
  const stamp = now(),
    cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const key = createHmac("sha256", env.INVITE_RATE_LIMIT_SALT)
    .update(context)
    .digest("hex");
  const row = await db()
    .prepare(
      "INSERT INTO tb_baseline_rate_limits(bucket_hash,window_started_at,attempts) VALUES(?,?,1) ON CONFLICT(bucket_hash) DO UPDATE SET attempts=CASE WHEN window_started_at < ? THEN 1 ELSE attempts+1 END, window_started_at=CASE WHEN window_started_at < ? THEN excluded.window_started_at ELSE window_started_at END RETURNING attempts",
    )
    .bind(key, stamp, cutoff, cutoff)
    .first<{ attempts: number }>();
  if (!row || row.attempts > maximum)
    throw new BaselineError(
      "Too many access attempts. Please wait ten minutes.",
      429,
    );
  void request; // Only the platform-supplied IP is passed in by callers, never forwarded headers.
}
export async function redeem(request: Request, token: string) {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  // Shared office networks need a larger budget than a single private invitation.
  await rateLimit(request, "redeem-ip:" + ip, 120);
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new BaselineError(
      "This invitation is not available. Ask the organiser for a new link.",
      403,
    );
  await rateLimit(request, "redeem-token:" + hashToken(token), 10);
  const stamp = now();
  const p = await db()
    .prepare(
      "SELECT p.participant_id,p.campaign_id,i.invite_id,i.expires_at FROM tb_baseline_invites i JOIN tb_baseline_participants p ON p.participant_id=i.participant_id JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE i.token_hash=? AND i.revoked_at IS NULL AND i.expires_at>? AND p.active=1 AND c.status='open' AND c.closes_at>?",
    )
    .bind(hashToken(token), stamp, stamp)
    .first<{
      participant_id: string;
      campaign_id: string;
      invite_id: string;
      expires_at: string;
    }>();
  if (!p)
    throw new BaselineError(
      "This invitation is not available. Ask the organiser for a new link.",
      403,
    );
  const session = randomBytes(32).toString("hex");
  const expires = new Date(
    Math.min(Date.now() + 12 * 60 * 60 * 1000, Date.parse(p.expires_at)),
  ).toISOString();
  await db()
    .prepare("INSERT INTO tb_baseline_sessions VALUES(?,?,?,?,?)")
    .bind(hashToken(session), p.participant_id, p.invite_id, expires, stamp)
    .run();
  await audit(
    p.participant_id,
    "participant_access",
    p.campaign_id,
    p.participant_id,
  );
  return { session, expires };
}
export type Identity = {
  participant_id: string;
  campaign_id: string;
  email: string;
  profile_json: string;
  name: string;
  version: string;
  privacy_notice: string;
  status: string;
  closes_at: string;
  session_hash: string;
  entities_json: string;
};
export async function endSession() {
  const token = (await cookies()).get(COOKIE)?.value ?? "";
  if (/^[a-f0-9]{64}$/.test(token))
    await db()
      .prepare("DELETE FROM tb_baseline_sessions WHERE session_hash=?")
      .bind(hashToken(token))
      .run();
}
export async function participant(request: Request): Promise<Identity> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) {
    await rateLimit(
      request,
      "bad-session:" + (request.headers.get("cf-connecting-ip") ?? "local"),
    );
    throw new BaselineError("Open your invitation link to continue.", 401);
  }
  const stamp = now();
  const p = await db()
    .prepare(
      "SELECT p.participant_id,p.campaign_id,p.email,p.profile_json,c.name,c.version,c.privacy_notice,c.status,c.closes_at,c.entities_json,s.session_hash FROM tb_baseline_sessions s JOIN tb_baseline_participants p ON p.participant_id=s.participant_id JOIN tb_baseline_invites i ON i.invite_id=s.invite_id JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE s.session_hash=? AND s.expires_at>? AND i.revoked_at IS NULL AND i.expires_at>? AND p.active=1",
    )
    .bind(hashToken(token), stamp, stamp)
    .first<Identity>();
  if (!p) {
    await rateLimit(
      request,
      "bad-session:" + (request.headers.get("cf-connecting-ip") ?? "local"),
    );
    throw new BaselineError(
      "Your secure session has ended. Open your invitation link again.",
      401,
    );
  }
  return p;
}
type ResponseRow = {
  draft_json: string;
  revision: number;
  progress: number;
  status: string;
  updated_at: string;
  submitted_at: string | null;
};
export async function readResponse(p: Identity) {
  if (p.version !== VERSION)
    throw new BaselineError(
      "This invitation belongs to an earlier questionnaire. Ask the organiser for the updated invitation. Your earlier answers are retained.",
      409,
    );
  const row = await db()
    .prepare("SELECT * FROM tb_baseline_responses WHERE participant_id=?")
    .bind(p.participant_id)
    .first<ResponseRow>();
  if (!row) throw new BaselineError("The response is not available.", 404);
  return {
    campaign: {
      name: p.name,
      privacy: p.privacy_notice,
      version: p.version,
      entities: JSON.parse(p.entities_json) as EntityOption[],
      closed: p.status !== "open" || p.closes_at <= now(),
    },
    // Roster information is for administration/analysis; never echo it to participants.
    draft: {
      ...JSON.parse(row.draft_json),
      profile: initialDraft().profile,
    } as Draft,
    revision: row.revision,
    progress: row.progress,
    status: row.status,
    updatedAt: row.updated_at,
  };
}
export async function saveResponse(
  p: Identity,
  input: unknown,
  revision: number,
  progress: number,
  submit = false,
) {
  if (p.status !== "open" || p.closes_at <= now())
    throw new BaselineError(
      "This campaign is closed. Your saved answers are safe.",
      409,
    );
  if (
    !Number.isSafeInteger(revision) ||
    revision < 0 ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 8
  )
    throw new BaselineError("Please reload your saved response.");
  let draft: Draft;
  try {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error("Please check your answers.");
    draft = parseDraft({
      ...input,
      profile: initialDraft(JSON.parse(p.profile_json)).profile,
    });
    const choices = JSON.parse(p.entities_json) as EntityOption[];
    if (
      !draft.scope.entities.every((code) =>
        choices.some((choice) => choice.code === code),
      )
    )
      throw new Error("Choose entities from this campaign's list.");
  } catch (error) {
    throw new BaselineError(
      error instanceof Error ? error.message : "Please check your answers.",
    );
  }
  draft.profile.email = p.email; // All roster metadata remains authoritative on the server.
  if (draft.version !== p.version)
    throw new BaselineError("The questionnaire version has changed.", 409);
  if (submit) {
    const error = completionError(draft, JSON.parse(p.entities_json));
    if (error) throw new BaselineError(error);
  }
  const mutation = randomUUID(),
    stamp = now();
  const database = db();
  const statements = [
    database
      .prepare(
        "UPDATE tb_baseline_responses SET draft_json=?,status=?,progress=?,revision=revision+1,mutation_id=?,updated_at=?,submitted_at=? WHERE participant_id=? AND revision=? AND status!='completed' AND EXISTS(SELECT 1 FROM tb_baseline_sessions s JOIN tb_baseline_invites i ON i.invite_id=s.invite_id JOIN tb_baseline_participants p ON p.participant_id=s.participant_id JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE s.session_hash=? AND s.participant_id=tb_baseline_responses.participant_id AND s.expires_at>? AND i.revoked_at IS NULL AND i.expires_at>? AND p.active=1 AND c.status='open' AND c.closes_at>?)",
      )
      .bind(
        JSON.stringify(draft),
        submit ? "completed" : "in_progress",
        submit ? 8 : progress,
        mutation,
        stamp,
        submit ? stamp : null,
        p.participant_id,
        revision,
        p.session_hash,
        stamp,
        stamp,
        stamp,
      ),
    database
      .prepare(
        "DELETE FROM tb_baseline_work WHERE participant_id=? AND EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
      )
      .bind(p.participant_id, p.participant_id, mutation),
  ];
  for (const code of draft.areas) {
    const area = [...AREAS, ...draft.customAreas].find((a) => a.code === code)!;
    statements.push(
      database
        .prepare(
          "INSERT INTO tb_baseline_work SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
        )
        .bind(
          p.participant_id,
          code,
          area.label,
          area.category,
          areaPillar(area.category, area.code),
          draft.allocation[code] ?? null,
          JSON.stringify(draft.details[code] ?? {}),
          p.participant_id,
          mutation,
        ),
    );
  }
  if (submit)
    statements.push(
      database
        .prepare(
          "INSERT INTO tb_baseline_audit SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
        )
        .bind(
          randomUUID(),
          p.campaign_id,
          p.participant_id,
          "submitted",
          p.participant_id,
          "{}",
          stamp,
          p.participant_id,
          mutation,
        ),
    );
  const result = await database.batch(statements);
  if (!result[0].meta.changes)
    throw new BaselineError(
      "A newer save exists, or this response is already submitted. Reload before editing.",
      409,
    );
  return {
    revision: revision + 1,
    updatedAt: stamp,
    status: submit ? "completed" : "in_progress",
  };
}
export async function campaigns() {
  return (
    await db()
      .prepare(
        "SELECT c.*,COUNT(p.participant_id) AS participants FROM tb_baseline_campaigns c LEFT JOIN tb_baseline_participants p ON p.campaign_id=c.campaign_id GROUP BY c.campaign_id ORDER BY c.created_at DESC",
      )
      .all()
  ).results;
}
function entityChoices(input: unknown): EntityOption[] {
  const text = String(input ?? "");
  if (text.length > 60000)
    throw new BaselineError("Please shorten the entity list.");
  const labels = text
    .split(/\r?\n/)
    .map((label) => label.trim())
    .filter(Boolean);
  if (
    labels.length > 300 ||
    labels.some((label) => label.length > 200) ||
    new Set(labels.map((label) => label.toLowerCase())).size !== labels.length
  )
    throw new BaselineError(
      "Use up to 300 unique entity or brand names, one per line.",
    );
  return labels.map((label) => ({
    code: "entity_" + hashToken(label.toLowerCase()).slice(0, 16),
    label,
  }));
}
export async function campaignRows(campaign: string) {
  const c = await db()
    .prepare("SELECT * FROM tb_baseline_campaigns WHERE campaign_id=?")
    .bind(campaign)
    .first();
  if (!c) throw new BaselineError("Campaign not found.", 404);
  const rows = (
    await db()
      .prepare(
        "SELECT p.participant_id,p.email,p.profile_json,p.active,COALESCE(m.metadata_json,'{}') AS metadata_json,r.draft_json,r.status,r.progress,r.revision,r.submitted_at,r.updated_at,(SELECT MAX(i.expires_at) FROM tb_baseline_invites i WHERE i.participant_id=p.participant_id AND i.revoked_at IS NULL) AS invite_expires_at,EXISTS(SELECT 1 FROM tb_baseline_invites i WHERE i.participant_id=p.participant_id) AS invited FROM tb_baseline_participants p JOIN tb_baseline_responses r ON r.participant_id=p.participant_id LEFT JOIN tb_baseline_roster_details m ON m.participant_id=p.participant_id WHERE p.campaign_id=? ORDER BY p.created_at,p.participant_id",
      )
      .bind(campaign)
      .all<Record<string, unknown>>()
  ).results;
  return {
    campaign: {
      ...c,
      name: String(c.name),
      status: String(c.status),
      closes_at: String(c.closes_at),
      privacy_notice: String(c.privacy_notice),
      retention_days: Number(c.retention_days),
      version: String(c.version),
      entities: JSON.parse(String(c.entities_json)) as EntityOption[],
    },
    participants: rows.map((row) => ({
      ...row,
      participant_id: String(row.participant_id),
      email: String(row.email),
      active: Number(row.active),
      invited: Number(row.invited),
      invite_expires_at: row.invite_expires_at
        ? String(row.invite_expires_at)
        : null,
      status: String(row.status),
      progress: Number(row.progress),
      updated_at: String(row.updated_at),
      submitted_at: row.submitted_at,
      profile: JSON.parse(String(row.profile_json)),
      draft: JSON.parse(String(row.draft_json)) as Draft,
      roster: JSON.parse(String(row.metadata_json)),
      revision: Number(row.revision),
      metadata_json: undefined,
      profile_json: undefined,
      draft_json: undefined,
    })),
  };
}
export async function createCampaign(
  actor: string,
  body: Record<string, unknown>,
) {
  const name = String(body.name ?? "").trim(),
    notice = String(body.privacy ?? PRIVACY).trim(),
    closes = new Date(String(body.closesAt ?? "")),
    retention = Number(body.retentionDays ?? 90);
  if (
    !name ||
    name.length > 150 ||
    notice.length < 50 ||
    notice.length > 4000 ||
    !Number.isFinite(closes.getTime()) ||
    closes.getTime() < Date.now() ||
    !Number.isInteger(retention) ||
    retention < 30 ||
    retention > 730
  )
    throw new BaselineError(
      "Add a campaign name, future closing date, data-use notice and retention period (30–730 days).",
    );
  const id = randomUUID(),
    stamp = now(),
    definition = JSON.stringify(QUESTIONNAIRE),
    database = db();
  const entities = entityChoices(body.entityList);
  let copiedProfiles: Record<string, string>[] = [];
  if (body.copyRosterFrom) {
    const source = await database
      .prepare(
        "SELECT campaign_id FROM tb_baseline_campaigns WHERE campaign_id=?",
      )
      .bind(String(body.copyRosterFrom))
      .first();
    if (!source)
      throw new BaselineError("The source campaign is not available.", 404);
    const roster = (
      await database
        .prepare(
          "SELECT p.profile_json,COALESCE(m.metadata_json,'{}') AS metadata_json FROM tb_baseline_participants p LEFT JOIN tb_baseline_roster_details m USING(participant_id) WHERE campaign_id=? AND active=1",
        )
        .bind(String(body.copyRosterFrom))
        .all<{ profile_json: string; metadata_json: string }>()
    ).results;
    if (roster.length > 200)
      throw new BaselineError(
        "Create the revised campaign and import this larger roster in batches of 200.",
      );
    const fields = [
      "name",
      "email",
      "job_title",
      "country",
      "region",
      "entity",
      "work_type",
      "manages_people",
      "direct_reports",
    ];
    copiedProfiles = roster.map((row) => {
      const profile = {
        ...JSON.parse(row.profile_json),
        ...JSON.parse(row.metadata_json),
      };
      return {
        ...Object.fromEntries(
          fields.map((field) => [field, String(profile[field] ?? "")]),
        ),
        ...rosterMetadata(profile),
      };
    });
  }
  await database
    .prepare("INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)")
    .bind(VERSION, definition, stamp)
    .run();
  const existing = await database
    .prepare("SELECT definition_json FROM tb_baseline_versions WHERE version=?")
    .bind(VERSION)
    .first<{ definition_json: string }>();
  if (existing?.definition_json !== definition)
    throw new BaselineError(
      "Questionnaire version differs. A new version is required.",
      409,
    );
  await database.batch([
    database
      .prepare(
        "INSERT INTO tb_baseline_campaigns(campaign_id,name,version,status,closes_at,privacy_notice,retention_days,created_at,entities_json) VALUES(?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        name,
        VERSION,
        "draft",
        closes.toISOString(),
        notice,
        retention,
        stamp,
        JSON.stringify(entities),
      ),
    database
      .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
      .bind(randomUUID(), id, actor, "campaign_created", id, "{}", stamp),
  ]);
  if (copiedProfiles.length)
    await importRoster(actor, id, toCsv(copiedProfiles));
  return { campaignId: id };
}
export async function configureCampaign(
  actor: string,
  campaign: string,
  body: Record<string, unknown>,
) {
  const c = await db()
    .prepare("SELECT * FROM tb_baseline_campaigns WHERE campaign_id=?")
    .bind(campaign)
    .first();
  if (!c) throw new BaselineError("Campaign not found.", 404);
  const status = String(body.status ?? c.status),
    privacy = String(body.privacy ?? c.privacy_notice),
    closes = new Date(String(body.closesAt ?? c.closes_at)),
    retention = Number(body.retentionDays ?? c.retention_days);
  const entities =
    body.entityList === undefined
      ? JSON.parse(String(c.entities_json))
      : entityChoices(body.entityList);
  if (
    !["draft", "open", "closed"].includes(status) ||
    privacy.length < 50 ||
    privacy.length > 4000 ||
    !Number.isFinite(closes.getTime()) ||
    !Number.isInteger(retention) ||
    retention < 30 ||
    retention > 730
  )
    throw new BaselineError("Check the campaign settings.");
  if (
    status === "open" &&
    baselineEnv().NEXT_PUBLIC_APP_ENV !== "qa" &&
    (String(c.version) !== REVIEWED_COLLECTION_VERSION ||
      String(VERSION) !== REVIEWED_COLLECTION_VERSION)
  )
    throw new BaselineError(
      "The reviewed questionnaire is not ready for production collection.",
      409,
    );
  if (
    (privacy !== c.privacy_notice ||
      JSON.stringify(entities) !== c.entities_json) &&
    (await db()
      .prepare(
        "SELECT 1 FROM tb_baseline_invites i JOIN tb_baseline_participants p ON p.participant_id=i.participant_id WHERE p.campaign_id=? LIMIT 1",
      )
      .bind(campaign)
      .first())
  )
    throw new BaselineError(
      "Create a new campaign to change the data-use statement or entity choices after invitations have been generated.",
      409,
    );
  await db().batch([
    db()
      .prepare(
        "UPDATE tb_baseline_campaigns SET status=?,privacy_notice=?,closes_at=?,retention_days=?,entities_json=? WHERE campaign_id=?",
      )
      .bind(
        status,
        privacy,
        closes.toISOString(),
        retention,
        JSON.stringify(entities),
        campaign,
      ),
    db()
      .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
      .bind(
        randomUUID(),
        campaign,
        actor,
        "campaign_configured",
        campaign,
        JSON.stringify({
          status,
          retentionDays: retention,
          privacyHash: hashToken(privacy),
          entityChoicesHash: hashToken(JSON.stringify(entities)),
        }),
        now(),
      ),
  ]);
  return { success: true };
}
export async function importRoster(
  actor: string,
  campaign: string,
  csv: string,
) {
  const c = await db()
    .prepare("SELECT version FROM tb_baseline_campaigns WHERE campaign_id=?")
    .bind(campaign)
    .first<{ version: string }>();
  if (!c || c.version !== VERSION)
    throw new BaselineError("Campaign not found.", 404);
  let profiles: Partial<Profile>[];
  try {
    profiles = parseRoster(csv);
  } catch (error) {
    throw new BaselineError(
      error instanceof Error ? error.message : "Check the CSV.",
    );
  }
  if (!profiles.length) throw new BaselineError("The roster is empty.");
  const existing = new Set(
    (
      await db()
        .prepare(
          "SELECT email FROM tb_baseline_participants WHERE campaign_id=?",
        )
        .bind(campaign)
        .all<{ email: string }>()
    ).results.map((p) => p.email),
  );
  if (profiles.some((p) => existing.has(p.email!)))
    throw new BaselineError(
      "An email is already in this campaign. No rows were imported.",
      409,
    );
  const stamp = now(),
    database = db(),
    statements: D1PreparedStatement[] = [];
  for (const profile of profiles) {
    const id = randomUUID(),
      draft = initialDraft(
        Object.fromEntries(
          CORE_ROSTER_FIELDS.map((key) => [
            key,
            (profile as Record<string, string>)[key] ?? "",
          ]),
        ),
      );
    statements.push(
      database
        .prepare("INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)")
        .bind(
          id,
          campaign,
          profile.email!,
          JSON.stringify(draft.profile),
          stamp,
        ),
      database
        .prepare("INSERT INTO tb_baseline_roster_details VALUES(?,?,?)")
        .bind(
          id,
          JSON.stringify(rosterMetadata(profile as Record<string, unknown>)),
          stamp,
        ),
      database
        .prepare(
          "INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)",
        )
        .bind(
          id,
          VERSION,
          "not_started",
          randomUUID(),
          JSON.stringify(draft),
          stamp,
        ),
    );
  }
  statements.push(
    database
      .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
      .bind(
        randomUUID(),
        campaign,
        actor,
        "roster_imported",
        campaign,
        JSON.stringify({ count: profiles.length }),
        stamp,
      ),
  );
  await database.batch(statements);
  return { imported: profiles.length };
}
export async function invite(
  actor: string,
  campaign: string,
  participantId: string,
  send: boolean,
) {
  const p = await db()
    .prepare(
      "SELECT p.email,p.profile_json,c.name,c.closes_at,c.version FROM tb_baseline_participants p JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE p.participant_id=? AND p.campaign_id=? AND p.active=1 AND c.status='open'",
    )
    .bind(participantId, campaign)
    .first<{
      email: string;
      profile_json: string;
      version: string;
      name: string;
      closes_at: string;
    }>();
  if (!p || p.closes_at <= now())
    throw new BaselineError(
      "Open the campaign before inviting an active participant.",
    );
  const token = randomBytes(32).toString("hex"),
    id = randomUUID(),
    stamp = now(),
    expires = new Date(
      Math.min(Date.now() + 30 * 86400000, Date.parse(p.closes_at)),
    ).toISOString();
  const env = baselineEnv(),
    site = env.NEXT_PUBLIC_SITE_URL;
  if (!site || new URL(site).protocol !== "https:")
    throw new BaselineError("The assessment site URL is not configured.", 503);
  if (
    send &&
    env.NEXT_PUBLIC_APP_ENV !== "qa" &&
    (p.version !== REVIEWED_COLLECTION_VERSION ||
      String(VERSION) !== REVIEWED_COLLECTION_VERSION)
  )
    throw new BaselineError(
      "The reviewed questionnaire is not ready for production invitations.",
      409,
    );
  if (send && env.BASELINE_MAIL_MODE !== "send")
    throw new BaselineError(
      "Email is disabled in QA. Generate a test link instead.",
    );
  if (send && (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL))
    throw new BaselineError("Email is not configured.", 503);
  await db().batch([
    db()
      .prepare(
        "UPDATE tb_baseline_invites SET revoked_at=? WHERE participant_id=? AND revoked_at IS NULL",
      )
      .bind(stamp, participantId),
    db()
      .prepare("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)")
      .bind(id, participantId, hashToken(token), expires, stamp),
    db()
      .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
      .bind(
        randomUUID(),
        campaign,
        actor,
        "invitation_generated",
        participantId,
        JSON.stringify({ send }),
        stamp,
      ),
  ]);
  const link = `${site.replace(/\/$/, "")}/baseline/start#${token}`;
  if (send) {
    if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL)
      throw new BaselineError("Email is not configured.", 503);
    const result = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.CONTACT_FROM_EMAIL,
      to: p.email,
      replyTo: env.CONTACT_TO_EMAIL,
      subject: "team.blue: describe your current work",
      text: `You are invited to ${p.name}. This is a current-work baseline, not a performance assessment. Allow about 20–25 minutes. You can save and return. Keep this secure link private:\n\n${link}\n\nPlease do not forward it. Contact the organiser if you need help.`,
    });
    if (result.error) {
      await audit(actor, "invitation_delivery_failed", campaign, participantId);
      throw new BaselineError(
        "The invitation was created, but email delivery failed. Generate or resend it again.",
        502,
      );
    }
    await audit(actor, "invitation_sent", campaign, participantId);
  }
  return { link: send ? undefined : link, sent: send, expiresAt: expires };
}
export async function revoke(
  actor: string,
  campaign: string,
  participantId: string,
) {
  await db().batch([
    db()
      .prepare(
        "UPDATE tb_baseline_participants SET active=0 WHERE participant_id=? AND campaign_id=?",
      )
      .bind(participantId, campaign),
    db()
      .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
      .bind(
        randomUUID(),
        campaign,
        actor,
        "participant_access_revoked",
        participantId,
        "{}",
        now(),
      ),
  ]);
  return { success: true };
}
export async function exportDataset(
  actor: string,
  campaign: string,
  format: string,
) {
  const data = await campaignRows(campaign),
    respondents: Record<string, unknown>[] = [],
    activities: Record<string, unknown>[] = [];
  const work = (
    await db()
      .prepare(
        "SELECT w.* FROM tb_baseline_work w JOIN tb_baseline_participants p USING(participant_id) WHERE p.campaign_id=?",
      )
      .bind(campaign)
      .all<{
        participant_id: string;
        area_code: string;
        label: string;
        category: string;
        pillar: string;
        percentage: number | null;
        detail_json: string;
      }>()
  ).results;
  const capturedWork = new Map(
    work.map((row) => [row.participant_id + ":" + row.area_code, row]),
  );
  for (const p of data.participants) {
    const draft = p.draft as Draft & { friction?: string };
    const base = {
      participant_id: p.participant_id,
      campaign_id: campaign,
      questionnaire_version: draft.version,
      status: p.status,
      progress: p.progress,
      submitted_at: p.submitted_at,
      ...p.profile,
      ...p.roster,
      access_active: Number(p.active),
      primary_pillar: pillar(draft.profile.work_type),
    };
    respondents.push({
      ...base,
      areas: draft.areas,
      allocation: draft.allocation,
      support_scope: draft.scope ?? null,
      supported_entities: (draft.scope?.entities ?? []).map(
        (code) =>
          (data.campaign.entities as EntityOption[]).find(
            (entity) => entity.code === code,
          )?.label ?? code,
      ),
      activity_group_allocation: Object.fromEntries(
        ["ops", "bp", "tech", "office"].map((category) => [
          category,
          work
            .filter(
              (row) =>
                row.participant_id === p.participant_id &&
                row.category === category,
            )
            .reduce((sum, row) => sum + (row.percentage ?? 0), 0),
        ]),
      ),
      activity_pillar_allocation: Object.fromEntries(
        ["people_operations", "business_partnering", "people_technology"].map(
          (category) => [
            category,
            work
              .filter(
                (row) =>
                  row.participant_id === p.participant_id &&
                  row.pillar === category,
              )
              .reduce((sum, row) => sum + (row.percentage ?? 0), 0),
          ],
        ),
      ),
      systems: draft.systems,
      knowledge: draft.knowledge,
      knowledge_detail: draft.knowledgeOther,
      channels: draft.channels,
      channel_detail: draft.channelOther,
      incoming_work_allocation: draft.channelAllocation ?? null,
      cyclical: draft.cyclical,
      extra_effort: draft.extraEffort ?? draft.friction ?? "",
      strengths: draft.strengths,
      anything: draft.anything,
    });
    for (const code of draft.areas) {
      const a = capturedWork.get(p.participant_id + ":" + code);
      if (!a)
        throw new BaselineError(
          "A saved activity is missing. Please contact the administrator before analysing this export.",
          503,
        );
      activities.push({
        ...base,
        area_code: code,
        area_label: a.label,
        work_category: a.category,
        activity_pillar: a.pillar,
        percentage: a.percentage,
        ...JSON.parse(a.detail_json),
      });
    }
  }
  await audit(actor, "dataset_exported", campaign, campaign, {
    format,
    respondents: respondents.length,
    activities: activities.length,
  });
  const definition = await db()
    .prepare("SELECT definition_json FROM tb_baseline_versions WHERE version=?")
    .bind(data.campaign.version)
    .first<{ definition_json: string }>();
  return format === "respondents"
    ? toCsv(respondents)
    : format === "activities"
      ? toCsv(activities)
      : JSON.stringify(
          {
            campaign: data.campaign,
            questionnaire: definition
              ? JSON.parse(definition.definition_json)
              : null,
            respondents,
            activities,
          },
          null,
          2,
        );
}

// Administration for the reviewed baseline. Launch is pinned to the saved collection version.
const REVIEWED_COLLECTION_VERSION = "team-blue-baseline-v3";
export async function previewRoster(campaign: string, csv: string) {
  const data = await campaignRows(campaign);
  let rows: Partial<Profile>[];
  try {
    rows = parseRoster(csv);
  } catch (e) {
    throw new BaselineError(e instanceof Error ? e.message : "Check the CSV.");
  }
  if (!rows.length) throw new BaselineError("The roster is empty.");
  const existing = new Set(
    data.participants.map((p) => String(p.email).toLowerCase()),
  );
  const duplicates = rows
    .filter((p) => existing.has(p.email!))
    .map((p) => p.email);
  return {
    rows,
    count: rows.length,
    duplicates,
    canImport: !duplicates.length,
  };
}
export async function changeParticipant(
  actor: string,
  campaign: string,
  id: string,
  body: Record<string, unknown>,
) {
  const data = await campaignRows(campaign),
    p = data.participants.find((p) => p.participant_id === id);
  if (!p)
    throw new BaselineError("Participant not found in this campaign.", 404);
  const action = String(body.action ?? "edit"),
    revision = Number(body.revision);
  if (
    !["edit", "remove", "reinstate"].includes(action) ||
    !Number.isSafeInteger(revision) ||
    revision !== p.revision
  )
    throw new BaselineError(
      "This record changed. Refresh the roster before making this change.",
      409,
    );
  let profile = p.profile as Profile,
    metadata = p.roster as Record<string, string>;
  if (action === "edit") {
    let parsed: Partial<Profile>[];
    try {
      parsed = parseRoster(String(body.csv ?? ""));
    } catch (e) {
      throw new BaselineError(
        e instanceof Error ? e.message : "Check the respondent details.",
      );
    }
    if (parsed.length !== 1)
      throw new BaselineError("Edit one respondent at a time.");
    const value = parsed[0];
    profile = initialDraft(
      Object.fromEntries(
        CORE_ROSTER_FIELDS.map((k) => [
          k,
          (value as Record<string, string>)[k] ?? "",
        ]),
      ),
    ).profile;
    metadata = rosterMetadata(value as Record<string, unknown>);
    if (
      data.participants.some(
        (other) => other.participant_id !== id && other.email === profile.email,
      )
    )
      throw new BaselineError(
        "This work email is already in the campaign.",
        409,
      );
  }
  const stamp = now(),
    mutation = randomUUID(),
    database = db(),
    emailChanged = profile.email !== p.email;
  const statements = [
    database
      .prepare(
        "UPDATE tb_baseline_responses SET revision=revision+1,mutation_id=? WHERE participant_id=? AND revision=?",
      )
      .bind(mutation, id, revision),
    database
      .prepare(
        "UPDATE tb_baseline_participants SET email=?,profile_json=?,active=? WHERE participant_id=? AND campaign_id=? AND EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
      )
      .bind(
        profile.email,
        JSON.stringify(profile),
        action === "remove" ? 0 : action === "reinstate" ? 1 : p.active,
        id,
        campaign,
        id,
        mutation,
      ),
    database
      .prepare(
        "INSERT INTO tb_baseline_roster_details SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?) ON CONFLICT(participant_id) DO UPDATE SET metadata_json=excluded.metadata_json,updated_at=excluded.updated_at",
      )
      .bind(id, JSON.stringify(metadata), stamp, id, mutation),
  ];
  if (emailChanged || action === "remove" || action === "reinstate")
    statements.push(
      database
        .prepare(
          "UPDATE tb_baseline_invites SET revoked_at=? WHERE participant_id=? AND revoked_at IS NULL AND EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
        )
        .bind(stamp, id, id, mutation),
      database
        .prepare(
          "DELETE FROM tb_baseline_sessions WHERE participant_id=? AND EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
        )
        .bind(id, id, mutation),
    );
  statements.push(
    database
      .prepare(
        "INSERT INTO tb_baseline_audit SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
      )
      .bind(
        randomUUID(),
        campaign,
        actor,
        "participant_" + action,
        id,
        JSON.stringify({
          emailChanged,
          changedFields:
            action === "edit"
              ? [
                  ...CORE_ROSTER_FIELDS.filter(
                    (k) => profile[k as keyof Profile] !== p.profile[k],
                  ),
                  ...Object.keys(metadata).filter(
                    (k) => metadata[k] !== p.roster[k],
                  ),
                ]
              : [],
          answersRetained: true,
        }),
        stamp,
        id,
        mutation,
      ),
  );
  const results = await database.batch(statements);
  if (results[0].meta.changes !== 1)
    throw new BaselineError("This record changed. Refresh the roster.", 409);
  return {
    success: true,
    needsNewInvitation: emailChanged || action === "reinstate",
  };
}
type DashboardScope = {
  regions: string[];
  countries: string[];
  entities: string[];
  role: "all" | "regional_lead" | "legacy";
  regionalLeaderEmail: string;
};
function dashboardScope(input: unknown): DashboardScope {
  const value = (input ?? {}) as Record<string, unknown>,
    scope: DashboardScope = {
      regions: [],
      countries: [],
      entities: [],
      role: "legacy",
      regionalLeaderEmail: "",
    };
  if (
    value.role !== undefined &&
    !["all", "regional_lead"].includes(String(value.role))
  )
    throw new BaselineError(
      "Choose campaign-wide or regional-leader visibility.",
    );
  scope.role =
    value.role === "all"
      ? "all"
      : value.role === "regional_lead"
        ? "regional_lead"
        : "legacy";
  scope.regionalLeaderEmail = String(value.regionalLeaderEmail ?? "")
    .trim()
    .toLowerCase();
  if (
    scope.role === "regional_lead" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(scope.regionalLeaderEmail)
  )
    throw new BaselineError("Choose a regional leader from the roster.");
  for (const key of ["regions", "countries", "entities"] as const) {
    const list = value[key] ?? [];
    if (
      !Array.isArray(list) ||
      list.length > 50 ||
      list.some((x) => typeof x !== "string" || !x.trim() || x.length > 250)
    )
      throw new BaselineError("Check dashboard scope.");
    scope[key] = [...new Set(list)] as string[];
  }
  return scope;
}
export async function completionDashboard(
  campaign: string,
  scopeInput: unknown = {},
  _shared = false,
) {
  const data = await campaignRows(campaign),
    scope = dashboardScope(scopeInput);
  if (_shared && scope.role === "legacy")
    throw new BaselineError("This dashboard link needs replacing.", 403);
  const eligible = data.participants
    .filter(
      (p) =>
        scope.role !== "regional_lead" ||
        p.roster.regional_leader_email === scope.regionalLeaderEmail,
    )
    .filter(
      (p) => !scope.regions.length || scope.regions.includes(p.profile.region),
    )
    .filter(
      (p) =>
        !scope.countries.length || scope.countries.includes(p.profile.country),
    )
    .filter(
      (p) =>
        !scope.entities.length || scope.entities.includes(p.profile.entity),
    );
  const active = eligible.filter((p) => Number(p.active) === 1),
    invited = active.filter((p) => Number(p.invited) === 1);
  const counts = {
    roster: active.length,
    removed: eligible.length - active.length,
    invited: invited.length,
    notInvited: active.length - invited.length,
    notStarted: invited.filter((p) => p.status === "not_started").length,
    inProgress: invited.filter((p) => p.status === "in_progress").length,
    completed: invited.filter((p) => p.status === "completed").length,
  };
  const groups: Record<
    string,
    { label: string; invited: number; completed: number; inProgress: number }[]
  > = {};
  for (const key of [
    "region",
    "country",
    "work_type",
    "entity",
    "division",
    "team",
  ]) {
    const map = new Map<
      string,
      { label: string; invited: number; completed: number; inProgress: number }
    >();
    for (const p of invited) {
      const label =
        String(p.profile[key] ?? p.roster[key] ?? "") || "Not recorded";
      const g = map.get(label) ?? {
        label,
        invited: 0,
        completed: 0,
        inProgress: 0,
      };
      g.invited++;
      if (p.status === "completed") g.completed++;
      if (p.status === "in_progress") g.inProgress++;
      map.set(label, g);
    }
    groups[key] = [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }
  return {
    campaign: {
      name: String(data.campaign.name),
      status: String(data.campaign.status),
      closesAt: String(data.campaign.closes_at),
    },
    counts,
    completionPercent: counts.invited
      ? Math.round((counts.completed / counts.invited) * 100)
      : 0,
    groups,
    generatedAt: now(),
    participants: eligible.map((p) => ({
      participantId: p.participant_id,
      name: String(p.profile.name),
      email: p.email,
      jobTitle: String(p.profile.job_title),
      country: String(p.profile.country),
      region: String(p.profile.region),
      entity: String(p.profile.entity),
      team: String(p.roster.team ?? ""),
      regionalLeaderName: String(p.roster.regional_leader_name ?? ""),
      regionalLeaderEmail: String(p.roster.regional_leader_email ?? ""),
      status: p.status,
      active: Number(p.active) === 1,
      invited: Number(p.invited) === 1,
      inviteExpiresAt: p.invite_expires_at,
      progress: p.progress,
      updatedAt: String(p.updated_at ?? ""),
      submittedAt: p.submitted_at ? String(p.submitted_at) : null,
    })),
    scope,
  };
}
export async function dashboardShares(campaign: string) {
  await campaignRows(campaign);
  return (
    await db()
      .prepare(
        "SELECT share_id,label,scope_json,expires_at,revoked_at,created_at FROM tb_baseline_dashboard_shares WHERE campaign_id=? ORDER BY created_at DESC",
      )
      .bind(campaign)
      .all()
  ).results;
}
export async function createDashboardShare(
  actor: string,
  campaign: string,
  body: Record<string, unknown>,
) {
  await campaignRows(campaign);
  const label = String(body.label ?? "").trim(),
    scope = dashboardScope(body.scope),
    days = Number(body.days ?? 14);
  if (
    !label ||
    label.length > 150 ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 30
  )
    throw new BaselineError(
      "Add a dashboard label and an expiry of 1–30 days.",
    );
  if (scope.role === "legacy")
    throw new BaselineError("Choose dashboard visibility.");
  if (scope.role === "regional_lead") {
    const roster = await campaignRows(campaign);
    if (
      !roster.participants.some(
        (p) => p.roster.regional_leader_email === scope.regionalLeaderEmail,
      )
    )
      throw new BaselineError(
        "This regional leader has no assigned respondents in the roster.",
      );
  }
  const id = randomUUID(),
    token = randomBytes(32).toString("hex"),
    stamp = now(),
    expires = new Date(Date.now() + days * 86400000).toISOString(),
    site = baselineEnv().NEXT_PUBLIC_SITE_URL;
  if (!site || new URL(site).protocol !== "https:")
    throw new BaselineError("Site URL is unavailable.", 503);
  await db().batch([
    db()
      .prepare(
        "INSERT INTO tb_baseline_dashboard_shares VALUES(?,?,?,?,?,?,NULL,?)",
      )
      .bind(
        id,
        campaign,
        label,
        JSON.stringify(scope),
        hashToken(token),
        expires,
        stamp,
      ),
    db()
      .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
      .bind(
        randomUUID(),
        campaign,
        actor,
        "dashboard_share_created",
        id,
        JSON.stringify({ scope, expires }),
        stamp,
      ),
  ]);
  return {
    link: site.replace(/\/$/, "") + "/baseline/dashboard#" + token,
    expiresAt: expires,
  };
}
export async function revokeDashboardShare(
  actor: string,
  campaign: string,
  id: string,
) {
  const share = await db()
    .prepare(
      "SELECT share_id FROM tb_baseline_dashboard_shares WHERE share_id=? AND campaign_id=?",
    )
    .bind(id, campaign)
    .first();
  if (!share) throw new BaselineError("Dashboard link not found.", 404);
  await db().batch([
    db()
      .prepare(
        "UPDATE tb_baseline_dashboard_shares SET revoked_at=? WHERE share_id=? AND campaign_id=?",
      )
      .bind(now(), id, campaign),
    db()
      .prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)")
      .bind(
        randomUUID(),
        campaign,
        actor,
        "dashboard_share_revoked",
        id,
        "{}",
        now(),
      ),
  ]);
  return { success: true };
}
export async function sharedDashboard(request: Request, token: string) {
  await rateLimit(
    request,
    "dashboard-ip:" + (request.headers.get("cf-connecting-ip") ?? "local"),
    240,
  );
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new BaselineError("This dashboard link is not available.", 403);
  const share = await db()
    .prepare(
      "SELECT campaign_id,scope_json FROM tb_baseline_dashboard_shares WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?",
    )
    .bind(hashToken(token), now())
    .first<{ campaign_id: string; scope_json: string }>();
  if (!share)
    throw new BaselineError(
      "This dashboard link has expired or been withdrawn.",
      403,
    );
  const scope = dashboardScope(JSON.parse(share.scope_json));
  if (scope.role === "legacy")
    throw new BaselineError(
      "This older dashboard link needs replacing. Ask the organiser for a new link.",
      403,
    );
  return completionDashboard(share.campaign_id, scope, true);
}
export async function launchReadiness(campaign: string) {
  const data = await campaignRows(campaign),
    env = baselineEnv(),
    active = data.participants.filter((p) => Number(p.active) === 1),
    blockers: string[] = [];
  if (
    data.campaign.version !== REVIEWED_COLLECTION_VERSION ||
    String(VERSION) !== REVIEWED_COLLECTION_VERSION
  )
    blockers.push(
      "The reviewed broad-work questionnaire still needs its versioned saving, submission and answer-copy flow. This campaign uses the earlier questionnaire.",
    );
  if (!active.length) blockers.push("Add at least one active respondent.");
  if (String(data.campaign.closes_at) <= now())
    blockers.push("Set a future closing date.");
  if (
    env.BASELINE_MAIL_MODE !== "send" ||
    !env.RESEND_API_KEY ||
    !env.CONTACT_FROM_EMAIL
  )
    blockers.push(
      "Invitation email delivery is disabled or not configured. QA must remain in preview mode.",
    );
  if (
    active.some(
      (p) =>
        !p.profile.manages_people || !p.profile.country || !p.profile.region,
    )
  )
    blockers.push(
      "Complete country, region and formal manager status for all active respondents.",
    );
  const missingCapacity = active.filter(
    (p) => !p.roster.contracted_hours && !p.roster.working_fraction,
  ).length;
  return {
    ready: !blockers.length,
    blockers,
    warnings: missingCapacity
      ? [
          `${missingCapacity} respondents have no contracted hours or working fraction. Capacity comparisons will be limited.`,
        ]
      : [],
    active: active.length,
    toInvite: active.filter((p) => !Number(p.invited)).length,
    questionnaireVersion: data.campaign.version,
  };
}
export async function launchCampaign(
  actor: string,
  campaign: string,
  body: Record<string, unknown>,
) {
  const readiness = await launchReadiness(campaign),
    data = await campaignRows(campaign);
  if (!readiness.ready)
    throw new BaselineError(
      "Launch is blocked: " + readiness.blockers.join(" "),
      409,
    );
  if (
    body.confirmation !== data.campaign.name ||
    Number(body.expectedActive) !== readiness.active
  )
    throw new BaselineError(
      "Confirm the current campaign name and roster count before launch.",
      409,
    );
  await configureCampaign(actor, campaign, { status: "open" });
  await audit(actor, "campaign_launched", campaign, campaign, {
    version: data.campaign.version,
    active: readiness.active,
  });
  return { success: true, toInvite: readiness.toInvite };
}
export async function inviteBatch(
  actor: string,
  campaign: string,
  body: Record<string, unknown>,
) {
  const readiness = await launchReadiness(campaign);
  if (!readiness.ready)
    throw new BaselineError(
      "Resolve launch readiness before sending invitations.",
      409,
    );
  const data = await campaignRows(campaign),
    ids = body.participantIds;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 20 ||
    new Set(ids).size !== ids.length ||
    ids.some(
      (id) =>
        typeof id !== "string" ||
        !data.participants.some(
          (p) =>
            p.participant_id === id &&
            Number(p.active) === 1 &&
            p.status !== "completed",
        ),
    )
  )
    throw new BaselineError(
      "Choose up to 20 active, incomplete respondents from this campaign.",
    );
  const sent: string[] = [],
    failed: string[] = [];
  for (const id of ids as string[])
    try {
      await invite(actor, campaign, id, true);
      sent.push(id);
    } catch {
      failed.push(id);
    }
  await audit(actor, "invitation_batch_finished", campaign, campaign, {
    sent: sent.length,
    failed: failed.length,
  });
  return { sent, failed };
}

export async function extendBaselineInvite(
  actor: string,
  campaign: string,
  id: string,
  body: Record<string, unknown>,
) {
  const data = await campaignRows(campaign),
    p = data.participants.find((p) => p.participant_id === id),
    days = Number(body.days ?? 21),
    revision = Number(body.revision);
  if (!p || !p.active || p.status === "completed")
    throw new BaselineError(
      "Only active, incomplete respondents can have an invitation extended.",
    );
  if (revision !== p.revision || !Number.isSafeInteger(revision))
    throw new BaselineError("This record changed. Refresh the roster.", 409);
  if (!Number.isInteger(days) || days < 1 || days > 90)
    throw new BaselineError("Choose 1–90 extra days.");
  const invitation = await db()
    .prepare(
      "SELECT invite_id,expires_at FROM tb_baseline_invites WHERE participant_id=? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1",
    )
    .bind(id)
    .first<{ invite_id: string; expires_at: string }>();
  if (!invitation)
    throw new BaselineError("Generate an invitation before extending it.");
  const expires = new Date(
    Math.min(
      Math.max(Date.now(), Date.parse(invitation.expires_at)) + days * 86400000,
      Date.parse(data.campaign.closes_at),
    ),
  ).toISOString();
  if (
    data.campaign.status !== "open" ||
    expires <= invitation.expires_at ||
    expires <= now()
  )
    throw new BaselineError(
      "Open the campaign and extend its closing date first. An invitation cannot outlast the campaign.",
    );
  const mutation = randomUUID(),
    database = db();
  const result = await database.batch([
    database
      .prepare(
        "UPDATE tb_baseline_responses SET revision=revision+1,mutation_id=? WHERE participant_id=? AND revision=?",
      )
      .bind(mutation, id, revision),
    database
      .prepare(
        "UPDATE tb_baseline_invites SET expires_at=? WHERE invite_id=? AND revoked_at IS NULL AND EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
      )
      .bind(expires, invitation.invite_id, id, mutation),
    database
      .prepare(
        "UPDATE tb_baseline_sessions SET expires_at=? WHERE invite_id=? AND EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
      )
      .bind(expires, invitation.invite_id, id, mutation),
    database
      .prepare(
        "INSERT INTO tb_baseline_audit SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)",
      )
      .bind(
        randomUUID(),
        campaign,
        actor,
        "invitation_extended",
        id,
        JSON.stringify({ days, expires }),
        now(),
        id,
        mutation,
      ),
  ]);
  if (result[0].meta.changes !== 1)
    throw new BaselineError("This record changed. Refresh the roster.", 409);
  return { success: true, expiresAt: expires };
}
