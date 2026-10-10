import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { Resend } from "resend";
import { AREAS, QUESTIONNAIRE, VERSION, PRIVACY, areaPillar, initialDraft, parseDraft, completionError, pillar, parseRoster, toCsv, type Draft, type Profile } from "./model";

type Env = CloudflareEnv & { BASELINE_ENABLED?: string; BASELINE_MAIL_MODE?: string; NEXT_PUBLIC_APP_ENV?: string; NEXT_PUBLIC_SITE_URL?: string; INVITE_RATE_LIMIT_SALT?: string; RESEND_API_KEY?: string; CONTACT_FROM_EMAIL?: string; CONTACT_TO_EMAIL?: string; D1_SYSTEM_EVENTS_MODE?: string; D1_CRM_PROSPECTS_MODE?: string; D1_DIAGNOSTIC_SUBMISSIONS_MODE?: string; D1_CLIENT_DIAGNOSTIC_MODE?: string; D1_CLIENT_DIAGNOSTIC_SECURITY_MODE?: string };
export class BaselineError extends Error { constructor(message: string, public status = 400) { super(message); } }
export const COOKIE = "__Host-tb_baseline";
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const now = () => new Date().toISOString();
export function baselineEnv(): Env {
  const env = getCloudflareContext().env as Env;
  if (env.BASELINE_ENABLED !== "true") throw new BaselineError("This assessment is not available.", 404);
  if (env.NEXT_PUBLIC_APP_ENV !== "qa" && [env.D1_SYSTEM_EVENTS_MODE, env.D1_CRM_PROSPECTS_MODE, env.D1_DIAGNOSTIC_SUBMISSIONS_MODE, env.D1_CLIENT_DIAGNOSTIC_MODE, env.D1_CLIENT_DIAGNOSTIC_SECURITY_MODE].some(mode => mode !== "d1")) throw new BaselineError("This assessment is not available.", 404);
  return env;
}
const db = () => baselineEnv().DB;
export const securityHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow, noarchive", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
export function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (!origin || origin !== new URL(request.url).origin) throw new BaselineError("Please open the assessment on this website and try again.", 403); }
export async function readBody(request: Request, limit = 75000): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new BaselineError("Use a JSON request.", 415);
  const reader = request.body?.getReader(); if (!reader) throw new BaselineError("No answers were received.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const {value, done} = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); throw new BaselineError("Please shorten the request.", 413); } chunks.push(value); }
  let text = ""; const decoder = new TextDecoder(); for (const chunk of chunks) text += decoder.decode(chunk, {stream:true}); text += decoder.decode();
  let parsed; try { parsed = JSON.parse(text); } catch { throw new BaselineError("Please check the request."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new BaselineError("Please check the request."); return parsed;
}
export async function audit(actor: string, action: string, campaign: string | null, subject: string | null, metadata: Record<string, unknown> = {}) {
  await db().prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)").bind(randomUUID(), campaign, actor, action, subject, JSON.stringify(metadata), now()).run();
}
export async function admin() { baselineEnv(); const user = await requireAdvisorUser(); if (!user?.email) throw new BaselineError("Administrator access is required.", 403); return user.email.toLowerCase(); }
export async function rateLimit(request: Request, context: string, maximum = 20) {
  const env = baselineEnv(); if (!env.INVITE_RATE_LIMIT_SALT) throw new BaselineError("Secure access is temporarily unavailable.", 503);
  const stamp = now(), cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const key = createHmac("sha256", env.INVITE_RATE_LIMIT_SALT).update(context).digest("hex");
  const row = await db().prepare("INSERT INTO tb_baseline_rate_limits(bucket_hash,window_started_at,attempts) VALUES(?,?,1) ON CONFLICT(bucket_hash) DO UPDATE SET attempts=CASE WHEN window_started_at < ? THEN 1 ELSE attempts+1 END, window_started_at=CASE WHEN window_started_at < ? THEN excluded.window_started_at ELSE window_started_at END RETURNING attempts").bind(key,stamp,cutoff,cutoff).first<{attempts:number}>();
  if (!row || row.attempts > maximum) throw new BaselineError("Too many access attempts. Please wait ten minutes.", 429);
  void request; // Only the platform-supplied IP is passed in by callers, never forwarded headers.
}
export async function redeem(request: Request, token: string) {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  await rateLimit(request, "redeem-ip:" + ip);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new BaselineError("This invitation is not available. Ask the organiser for a new link.", 403);
  await rateLimit(request, "redeem-token:" + hashToken(token), 10);
  const stamp = now();
  const p = await db().prepare("SELECT p.participant_id,p.campaign_id,i.invite_id,i.expires_at FROM tb_baseline_invites i JOIN tb_baseline_participants p ON p.participant_id=i.participant_id JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE i.token_hash=? AND i.revoked_at IS NULL AND i.expires_at>? AND p.active=1 AND c.status='open' AND c.closes_at>?").bind(hashToken(token),stamp,stamp).first<{participant_id:string;campaign_id:string;invite_id:string;expires_at:string}>();
  if (!p) throw new BaselineError("This invitation is not available. Ask the organiser for a new link.", 403);
  const session = randomBytes(32).toString("hex"); const expires = new Date(Math.min(Date.now() + 12 * 60 * 60 * 1000, Date.parse(p.expires_at))).toISOString();
  await db().prepare("INSERT INTO tb_baseline_sessions VALUES(?,?,?,?,?)").bind(hashToken(session),p.participant_id,p.invite_id,expires,stamp).run();
  await audit(p.participant_id,"participant_access",p.campaign_id,p.participant_id);
  return {session, expires};
}
export type Identity = {participant_id:string;campaign_id:string;email:string;profile_json:string;name:string;version:string;privacy_notice:string;status:string;closes_at:string;session_hash:string};
export async function endSession() {
  const token = (await cookies()).get(COOKIE)?.value ?? "";
  if (/^[a-f0-9]{64}$/.test(token)) await db().prepare("DELETE FROM tb_baseline_sessions WHERE session_hash=?").bind(hashToken(token)).run();
}
export async function participant(request: Request): Promise<Identity> {
  const jar = await cookies(); const token = jar.get(COOKIE)?.value ?? "";
  if (!/^[a-f0-9]{64}$/.test(token)) { await rateLimit(request,"bad-session:" + (request.headers.get("cf-connecting-ip") ?? "local")); throw new BaselineError("Open your invitation link to continue.",401); }
  const stamp = now();
  const p = await db().prepare("SELECT p.participant_id,p.campaign_id,p.email,p.profile_json,c.name,c.version,c.privacy_notice,c.status,c.closes_at,s.session_hash FROM tb_baseline_sessions s JOIN tb_baseline_participants p ON p.participant_id=s.participant_id JOIN tb_baseline_invites i ON i.invite_id=s.invite_id JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE s.session_hash=? AND s.expires_at>? AND i.revoked_at IS NULL AND i.expires_at>? AND p.active=1").bind(hashToken(token),stamp,stamp).first<Identity>();
  if (!p) { await rateLimit(request,"bad-session:" + (request.headers.get("cf-connecting-ip") ?? "local")); throw new BaselineError("Your secure session has ended. Open your invitation link again.",401); } return p;
}
type ResponseRow = {draft_json:string;revision:number;progress:number;status:string;updated_at:string;submitted_at:string|null};
export async function readResponse(p: Identity) {
  if (p.version !== VERSION) throw new BaselineError("This questionnaire version is not available.",409);
  const row = await db().prepare("SELECT * FROM tb_baseline_responses WHERE participant_id=?").bind(p.participant_id).first<ResponseRow>();
  if (!row) throw new BaselineError("The response is not available.",404);
  return {campaign:{name:p.name,privacy:p.privacy_notice,version:p.version,closed:p.status !== "open" || p.closes_at <= now()},draft:JSON.parse(row.draft_json) as Draft,revision:row.revision,progress:row.progress,status:row.status,updatedAt:row.updated_at};
}
export async function saveResponse(p: Identity, input: unknown, revision: number, progress: number, submit = false) {
  if (p.status !== "open" || p.closes_at <= now()) throw new BaselineError("This campaign is closed. Your saved answers are safe.",409);
  if (!Number.isSafeInteger(revision) || revision < 0 || !Number.isInteger(progress) || progress < 0 || progress > 8) throw new BaselineError("Please reload your saved response.");
  let draft: Draft; try { draft = parseDraft(input); } catch (error) { throw new BaselineError(error instanceof Error ? error.message : "Please check your answers."); }
  draft.profile.email = p.email; // Identity cannot be reassigned through a draft.
  if (draft.version !== p.version) throw new BaselineError("The questionnaire version has changed.",409);
  if (submit) { const error = completionError(draft); if (error) throw new BaselineError(error); }
  const mutation = randomUUID(), stamp = now(); const database = db();
  const statements = [database.prepare("UPDATE tb_baseline_responses SET draft_json=?,status=?,progress=?,revision=revision+1,mutation_id=?,updated_at=?,submitted_at=? WHERE participant_id=? AND revision=? AND status!='completed' AND EXISTS(SELECT 1 FROM tb_baseline_sessions s JOIN tb_baseline_invites i ON i.invite_id=s.invite_id JOIN tb_baseline_participants p ON p.participant_id=s.participant_id JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE s.session_hash=? AND s.participant_id=tb_baseline_responses.participant_id AND s.expires_at>? AND i.revoked_at IS NULL AND i.expires_at>? AND p.active=1 AND c.status='open' AND c.closes_at>?)").bind(JSON.stringify(draft),submit?"completed":"in_progress",submit?8:progress,mutation,stamp,submit?stamp:null,p.participant_id,revision,p.session_hash,stamp,stamp,stamp),
    database.prepare("DELETE FROM tb_baseline_work WHERE participant_id=? AND EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)").bind(p.participant_id,p.participant_id,mutation)];
  for (const code of draft.areas) { const area = [...AREAS,...draft.customAreas].find(a => a.code === code)!; statements.push(database.prepare("INSERT INTO tb_baseline_work SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)").bind(p.participant_id,code,area.label,area.category,areaPillar(area.category),draft.allocation[code] ?? null,JSON.stringify(draft.details[code] ?? {}),p.participant_id,mutation)); }
  if (submit) statements.push(database.prepare("INSERT INTO tb_baseline_audit SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)").bind(randomUUID(),p.campaign_id,p.participant_id,"submitted",p.participant_id,"{}",stamp,p.participant_id,mutation));
  const result = await database.batch(statements);
  if (!result[0].meta.changes) throw new BaselineError("A newer save exists, or this response is already submitted. Reload before editing.",409);
  return {revision:revision+1,updatedAt:stamp,status:submit?"completed":"in_progress"};
}
export async function campaigns() { return (await db().prepare("SELECT c.*,COUNT(p.participant_id) AS participants FROM tb_baseline_campaigns c LEFT JOIN tb_baseline_participants p ON p.campaign_id=c.campaign_id GROUP BY c.campaign_id ORDER BY c.created_at DESC").all()).results; }
export async function campaignRows(campaign: string) {
  const c = await db().prepare("SELECT * FROM tb_baseline_campaigns WHERE campaign_id=?").bind(campaign).first(); if (!c) throw new BaselineError("Campaign not found.",404);
  const rows = (await db().prepare("SELECT p.participant_id,p.email,p.profile_json,p.active,r.draft_json,r.status,r.progress,r.revision,r.submitted_at,r.updated_at,EXISTS(SELECT 1 FROM tb_baseline_invites i WHERE i.participant_id=p.participant_id) AS invited FROM tb_baseline_participants p JOIN tb_baseline_responses r ON r.participant_id=p.participant_id WHERE p.campaign_id=? ORDER BY p.created_at,p.participant_id").bind(campaign).all<Record<string, unknown>>()).results;
  return {campaign:c,participants:rows.map(row => ({...row,participant_id:String(row.participant_id),status:String(row.status),progress:Number(row.progress),submitted_at:row.submitted_at,profile:JSON.parse(String(row.profile_json)),draft:JSON.parse(String(row.draft_json)) as Draft,profile_json:undefined,draft_json:undefined}))};
}
export async function createCampaign(actor: string, body: Record<string,unknown>) {
  const name = String(body.name ?? "").trim(), notice = String(body.privacy ?? PRIVACY).trim(), closes = new Date(String(body.closesAt ?? "")), retention = Number(body.retentionDays ?? 90);
  if (!name || name.length > 150 || notice.length < 50 || notice.length > 4000 || !Number.isFinite(closes.getTime()) || closes.getTime() < Date.now() || !Number.isInteger(retention) || retention < 30 || retention > 730) throw new BaselineError("Add a campaign name, future closing date, data-use notice and retention period (30–730 days).");
  const id = randomUUID(), stamp = now(), definition = JSON.stringify(QUESTIONNAIRE), database = db();
  await database.prepare("INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)").bind(VERSION,definition,stamp).run();
  const existing = await database.prepare("SELECT definition_json FROM tb_baseline_versions WHERE version=?").bind(VERSION).first<{definition_json:string}>();
  if (existing?.definition_json !== definition) throw new BaselineError("Questionnaire version differs. A new version is required.",409);
  await database.batch([database.prepare("INSERT INTO tb_baseline_campaigns VALUES(?,?,?,?,?,?,?,?)").bind(id,name,VERSION,"draft",closes.toISOString(),notice,retention,stamp),database.prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)").bind(randomUUID(),id,actor,"campaign_created",id,"{}",stamp)]);
  return {campaignId:id};
}
export async function configureCampaign(actor:string, campaign:string, body:Record<string,unknown>) {
  const c = await db().prepare("SELECT * FROM tb_baseline_campaigns WHERE campaign_id=?").bind(campaign).first(); if (!c) throw new BaselineError("Campaign not found.",404);
  const status = String(body.status ?? c.status), privacy = String(body.privacy ?? c.privacy_notice), closes = new Date(String(body.closesAt ?? c.closes_at)), retention=Number(body.retentionDays??c.retention_days);
  if (!["draft","open","closed"].includes(status) || privacy.length < 50 || privacy.length > 4000 || !Number.isFinite(closes.getTime()) || !Number.isInteger(retention) || retention<30 || retention>730) throw new BaselineError("Check the campaign settings.");
  if(privacy!==c.privacy_notice&&await db().prepare("SELECT 1 FROM tb_baseline_invites i JOIN tb_baseline_participants p ON p.participant_id=i.participant_id WHERE p.campaign_id=? LIMIT 1").bind(campaign).first())throw new BaselineError("Create a new campaign to change the data-use statement after invitations have been generated.",409);
  await db().batch([db().prepare("UPDATE tb_baseline_campaigns SET status=?,privacy_notice=?,closes_at=?,retention_days=? WHERE campaign_id=?").bind(status,privacy,closes.toISOString(),retention,campaign),db().prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)").bind(randomUUID(),campaign,actor,"campaign_configured",campaign,JSON.stringify({status,retentionDays:retention,privacyHash:hashToken(privacy)}),now())]); return {success:true};
}
export async function importRoster(actor:string,campaign:string,csv:string) {
  const c = await db().prepare("SELECT version FROM tb_baseline_campaigns WHERE campaign_id=?").bind(campaign).first<{version:string}>(); if (!c || c.version !== VERSION) throw new BaselineError("Campaign not found.",404);
  let profiles: Partial<Profile>[]; try { profiles = parseRoster(csv); } catch (error) { throw new BaselineError(error instanceof Error ? error.message : "Check the CSV."); }
  if (!profiles.length) throw new BaselineError("The roster is empty.");
  const existing = new Set((await db().prepare("SELECT email FROM tb_baseline_participants WHERE campaign_id=?").bind(campaign).all<{email:string}>()).results.map(p=>p.email));
  if (profiles.some(p => existing.has(p.email!))) throw new BaselineError("An email is already in this campaign. No rows were imported.",409);
  const stamp=now(), database=db(), statements: D1PreparedStatement[]=[];
  for (const profile of profiles) { const id=randomUUID(),draft=initialDraft(profile); statements.push(database.prepare("INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)").bind(id,campaign,profile.email!,JSON.stringify(draft.profile),stamp),database.prepare("INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)").bind(id,VERSION,"not_started",randomUUID(),JSON.stringify(draft),stamp)); }
  statements.push(database.prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)").bind(randomUUID(),campaign,actor,"roster_imported",campaign,JSON.stringify({count:profiles.length}),stamp));
  await database.batch(statements); return {imported:profiles.length};
}
export async function invite(actor:string,campaign:string,participantId:string,send:boolean) {
  const p=await db().prepare("SELECT p.email,p.profile_json,c.name,c.closes_at FROM tb_baseline_participants p JOIN tb_baseline_campaigns c ON c.campaign_id=p.campaign_id WHERE p.participant_id=? AND p.campaign_id=? AND p.active=1 AND c.status='open'").bind(participantId,campaign).first<{email:string;profile_json:string;name:string;closes_at:string}>();
  if (!p || p.closes_at <= now()) throw new BaselineError("Open the campaign before inviting an active participant.");
  const token=randomBytes(32).toString("hex"),id=randomUUID(),stamp=now(),expires=new Date(Math.min(Date.now()+30*86400000,Date.parse(p.closes_at))).toISOString();
  const env=baselineEnv(),site=env.NEXT_PUBLIC_SITE_URL; if (!site || new URL(site).protocol !== "https:") throw new BaselineError("The assessment site URL is not configured.",503);
  if (send && env.BASELINE_MAIL_MODE !== "send") throw new BaselineError("Email is disabled in QA. Generate a test link instead.");
  await db().batch([db().prepare("UPDATE tb_baseline_invites SET revoked_at=? WHERE participant_id=? AND revoked_at IS NULL").bind(stamp,participantId),db().prepare("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)").bind(id,participantId,hashToken(token),expires,stamp),db().prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)").bind(randomUUID(),campaign,actor,"invitation_generated",participantId,JSON.stringify({send}),stamp)]);
  const link=`${site.replace(/\/$/,"")}/baseline/start#${token}`;
  if (send) { if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) throw new BaselineError("Email is not configured.",503); const result=await new Resend(env.RESEND_API_KEY).emails.send({from:env.CONTACT_FROM_EMAIL,to:p.email,replyTo:env.CONTACT_TO_EMAIL,subject:"team.blue: describe your current work",text:`You are invited to ${p.name}. This is a current-work baseline, not a performance assessment. Allow about 20–25 minutes. You can save and return. Keep this secure link private:\n\n${link}\n\nPlease do not forward it. Contact the organiser if you need help.`}); if (result.error) {await audit(actor,"invitation_delivery_failed",campaign,participantId);throw new BaselineError("The invitation was created, but email delivery failed. Generate or resend it again.",502);} await audit(actor,"invitation_sent",campaign,participantId); }
  return {link:send?undefined:link,sent:send,expiresAt:expires};
}
export async function revoke(actor:string,campaign:string,participantId:string) { await db().batch([db().prepare("UPDATE tb_baseline_participants SET active=0 WHERE participant_id=? AND campaign_id=?").bind(participantId,campaign),db().prepare("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)").bind(randomUUID(),campaign,actor,"participant_access_revoked",participantId,"{}",now())]); return {success:true}; }
export async function exportDataset(actor:string,campaign:string,format:string) {
  const data=await campaignRows(campaign), respondents:Record<string,unknown>[]=[], activities:Record<string,unknown>[]=[];
  for (const p of data.participants) { const draft=p.draft as Draft; const base={participant_id:p.participant_id,campaign_id:campaign,questionnaire_version:draft.version,status:p.status,progress:p.progress,submitted_at:p.submitted_at,...draft.profile,primary_pillar:pillar(draft.profile.work_type)};
    respondents.push({...base,areas:draft.areas,allocation:draft.allocation,systems:draft.systems,knowledge:draft.knowledge,knowledge_detail:draft.knowledgeOther,channels:draft.channels,channel_detail:draft.channelOther,cyclical:draft.cyclical,friction:draft.friction,strengths:draft.strengths,anything:draft.anything});
    for (const code of draft.areas) { const a=[...AREAS,...draft.customAreas].find(a=>a.code===code)!; activities.push({...base,area_code:code,area_label:a.label,work_category:a.category,activity_pillar:areaPillar(a.category),percentage:draft.allocation[code] ?? null,...draft.details[code]}); }
  }
  await audit(actor,"dataset_exported",campaign,campaign,{format,respondents:respondents.length,activities:activities.length});
  const definition = await db().prepare("SELECT definition_json FROM tb_baseline_versions WHERE version=?").bind(data.campaign.version).first<{definition_json:string}>();
  return format === "respondents" ? toCsv(respondents) : format === "activities" ? toCsv(activities) : JSON.stringify({campaign:data.campaign,questionnaire:definition?JSON.parse(definition.definition_json):null,respondents,activities},null,2);
}
