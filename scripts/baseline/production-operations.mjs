// Explicitly approved production baseline deployment and isolated synthetic test only.
// Never sends email or prints records, invitation tokens, session values or credentials.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { validateProductionBaselineApproval, validateSyntheticIdentity } from './production-guard.mjs';
import { verifyActivationBundle, bindingFingerprint, activationFlags } from '../d1/prepare-approved-production-activation.mjs';
const require=createRequire(import.meta.url);
const account='73221f18acc676e4992c89fcbf2b2a8f', database='b81b99d7-4b10-4f7e-a0c1-ada3adf596fc', worker='fractional-hr-site', site='https://vanesch.uk', apiSite='https://www.vanesch.uk';
const campaign='55000040-2026-4016-8040-000000000040';
const campaignName='[SYNTHETIC TEST] Production backend — 40 participants';
const credential=process.env.CLOUDFLARE_API_TOKEN;
const hash=x=>createHash('sha256').update(x).digest('hex');
const approval=JSON.parse(await readFile(new URL('./production-approval.json',import.meta.url)));
validateProductionBaselineApproval(approval,process.env);
async function cf(path,body){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+credential,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Production request failed: HTTP '+r.status);const b=await r.json();if(!b.success)throw Error('Production request returned an unsuccessful result.');return b.result;}
async function query(sql,params=[]){const r=await cf(`d1/database/${database}/query`,{sql,params});if(r.some(x=>!x.success))throw Error('Production database operation failed.');return r[0].results;}
async function settings(){const s=await cf(`workers/scripts/${worker}/settings`);const map=new Map(s.bindings.map(b=>[b.name,b]));if((map.get('DB')?.id??map.get('DB')?.database_id)!==database||activationFlags.some(n=>map.get(n)?.text!=='d1')||(map.get('ADVISOR_AUTH_MODE')?.text??'supabase')!=='supabase'||map.get('NEXT_PUBLIC_SITE_URL')?.text!==site)throw Error('Production D1, authentication or site identity differs.');return map;}
const mode=process.argv[2];
const configUrl=new URL('../../wrangler.jsonc',import.meta.url);
const recoveryUrl=new URL('../../baseline-production-recovery.json',import.meta.url);
const omitBaseline=map=>new Map([...map].filter(([n])=>!['BASELINE_ENABLED','BASELINE_MAIL_MODE','BASELINE_QA_EMAIL_TESTS'].includes(n)));
if(mode==='prepare'){
 await verifyActivationBundle(approval,process.env.GH_TOKEN);
 const map=await settings();const deployment=(await cf(`workers/scripts/${worker}/deployments`)).deployments?.[0];
 if(deployment?.id!==approval.expectedDeploymentId)throw Error('Production deployment changed since preparation.');
 const version=(await query("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_baseline_migrations'")).length;
 const existing=await query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'tb_baseline_%'");
 if(!version&&existing.length)throw Error('Baseline tables exist without dedicated migration history.');
 const files=['0001_baseline.sql','0002_campaign_entities.sql','0003_administration.sql','0004_reviewed_collection.sql'];
 for(const f of files){const sql=await readFile(new URL('../../baseline-migrations/'+f,import.meta.url),'utf8');if(hash(sql)!==approval.sqlHashes?.[f])throw Error('Approved baseline schema differs.');}
 const config=JSON.parse(await readFile(configUrl));
 if(config.name!==worker||config.d1_databases?.find(d=>d.binding==='DB')?.database_id!==database||config.env?.qa?.d1_databases?.some(d=>d.database_id===database)||activationFlags.some(n=>config.vars[n]!=='d1'))throw Error('Production deployment configuration differs.');
 const bookmark=await cf(`d1/database/${database}/time_travel/bookmark`);
 await writeFile(recoveryUrl,JSON.stringify({deploymentId:deployment.id,versions:deployment.versions,recoveryBookmark:bookmark.bookmark,bindingFingerprint:bindingFingerprint(omitBaseline(map))},null,2)+'\n',{mode:0o600});
 config.account_id=account;Object.assign(config.vars,{BASELINE_ENABLED:'true',BASELINE_MAIL_MODE:'preview',NEXT_PUBLIC_APP_ENV:'production',NEXT_PUBLIC_SITE_URL:site,NEXT_PUBLIC_SUPABASE_URL:'https://qxddddhhpfrrxbaunwfw.supabase.co'});
 config.d1_databases.find(d=>d.binding==='DB').migrations_dir='baseline-migrations';config.d1_databases.find(d=>d.binding==='DB').migrations_table='tb_baseline_migrations';
 await writeFile(configUrl,JSON.stringify(config,null,2)+'\n');
 console.log('Production baseline target, reviewed bundle and additive schema verified. Email remains disabled.');
}else if(mode==='verify'){
 const map=await settings();const saved=JSON.parse(await readFile(recoveryUrl));if(map.get('BASELINE_ENABLED')?.text!=='true'||map.get('BASELINE_MAIL_MODE')?.text!=='preview'||bindingFingerprint(omitBaseline(map))!==saved.bindingFingerprint)throw Error('Production baseline settings or unrelated bindings differ.');
 const history=await query('SELECT name FROM tb_baseline_migrations ORDER BY id');if(history.length!==4)throw Error('Dedicated baseline migration history differs.');
 const r=await fetch(apiSite+'/api/baseline/response',{redirect:'manual',signal:AbortSignal.timeout(15000)});if(r.status!==401)throw Error('Anonymous production response boundary differs.');await r.body?.cancel();console.log('Production baseline enabled with four dedicated migrations; anonymous boundary and existing authentication preserved. Email disabled.');
}else if(mode==='verify-live'){
 const map=await settings();
 if(map.get('BASELINE_ENABLED')?.text!=='true'||map.get('BASELINE_MAIL_MODE')?.text!=='preview')throw Error('Production baseline is not in no-email test mode.');
 const live=(await cf(`workers/scripts/${worker}/deployments`)).deployments?.[0];
 if(live?.versions?.length!==1||live.versions[0].version_id!==approval.expectedVersionId||live.versions[0].percentage!==100)throw Error('The expected deployed baseline version differs.');
 const history=await query('SELECT name FROM tb_baseline_migrations ORDER BY id');
 if(JSON.stringify(history.map(x=>x.name))!==JSON.stringify(Object.keys(approval.sqlHashes).sort()))throw Error('Dedicated baseline migration history differs.');
 for(const [path,expected] of [['/api/baseline/response',401],['/baseline/start',200]]){
  const r=await fetch(apiSite+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(r.status!==expected && !(path==='/api/baseline/response'&&r.status===429)){await r.body?.cancel();throw Error(`Production baseline check ${path}: HTTP ${r.status}, expected ${expected}.`);}
  await r.body?.cancel();
 }
 console.log('Deployed production baseline version, all four migrations, anonymous API boundary and participant entry verified on canonical www domain. Email disabled.');
}else if(mode==='seed'){
 const map=await settings();if(map.get('BASELINE_ENABLED')?.text!=='true'||map.get('BASELINE_MAIL_MODE')?.text!=='preview')throw Error('Production baseline is not in no-email test mode.');
 const {fixtures}=require('./production-fixtures.cjs');const fixturesRows=await fixtures();
 const esbuild=require('esbuild');const build=await esbuild.build({entryPoints:[new URL('../../lib/baseline/collection.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'cjs',write:false});const module={exports:{}};new Function('module','exports',build.outputFiles[0].text)(module,module.exports);const m=module.exports;
 const stamp=new Date().toISOString(),closes=new Date(Date.now()+30*86400000).toISOString();
 const prior=await query('SELECT name,version FROM tb_baseline_campaigns WHERE campaign_id=?',[campaign]);if(prior.length&&(prior[0].name!==campaignName||prior[0].version!==m.FROZEN_COLLECTION_VERSION))throw Error('Reserved synthetic campaign differs.');
 await query('INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)',[m.FROZEN_COLLECTION_VERSION,JSON.stringify(m.FROZEN_COLLECTION_DEFINITION),stamp]);const definition=await query('SELECT definition_json FROM tb_baseline_versions WHERE version=?',[m.FROZEN_COLLECTION_VERSION]);if(definition[0]?.definition_json!==JSON.stringify(m.FROZEN_COLLECTION_DEFINITION))throw Error('Production questionnaire definition differs.');
 await query('INSERT OR IGNORE INTO tb_baseline_campaigns VALUES(?,?,?,?,?,?,?,?,?)',[campaign,campaignName,m.FROZEN_COLLECTION_VERSION,'open',closes,'Synthetic backend test only. No employee data. Exclude this entire campaign from programme reporting.',30,stamp,'[]']);
 for(const f of fixturesRows){
  validateSyntheticIdentity(f.profile);if(f.draft.answerCopy)throw Error('Synthetic email copies are prohibited.');
  const id='55000040-2026-4016-8040-'+String(f.index).padStart(12,'0');
  const existing=await query('SELECT p.campaign_id,p.email,r.status FROM tb_baseline_participants p LEFT JOIN tb_baseline_responses r USING(participant_id) WHERE p.participant_id=?',[id]);
  if(existing.length){if(existing[0].campaign_id!==campaign||existing[0].email!==f.profile.email)throw Error('Synthetic participant identity differs.');if(existing[0].status===f.targetStatus)continue;throw Error('Synthetic test is partial; inspect before any retry. Existing answers preserved.');}
  await query('INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)',[id,campaign,f.profile.email,JSON.stringify(f.profile),stamp]);
  await query('INSERT INTO tb_baseline_roster_details VALUES(?,?,?)',[id,JSON.stringify({entity:'SYNTHETIC TEST ONLY',working_fraction:1,contracted_hours:40}),stamp]);
  await query('INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)',[id,m.FROZEN_COLLECTION_VERSION,'not_started',randomUUID(),JSON.stringify(m.initialCollection(m.FROZEN_COLLECTION_VERSION)),stamp]);
  if(f.targetStatus==='not_started')continue;
  const invite=randomUUID(),token=randomBytes(32).toString('hex'),session=randomBytes(32).toString('hex'),expires=new Date(Date.now()+2*3600000).toISOString();
  await query('INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)',[invite,id,hash(token),expires,stamp]);await query('INSERT INTO tb_baseline_sessions VALUES(?,?,?,?,?)',[hash(session),id,invite,expires,stamp]);
  async function api(path,body,expected=200){const r=await fetch(apiSite+'/api/baseline/'+path,{method:body?'POST':'GET',headers:{Origin:apiSite,Cookie:'__Host-tb_baseline='+session,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(20000)});if(!(Array.isArray(expected)?expected.includes(r.status):r.status===expected)){await r.body?.cancel();throw Error(`Synthetic participant ${f.index}: ${path} returned HTTP ${r.status}, expected ${expected}.`);}if(expected!==200){await r.body?.cancel();return null;}return r.json();}
  try{await api('response');await api('save',{draft:f.draft,revision:0,progress:4});const resumed=await api('response');if(resumed.revision!==1||JSON.stringify(resumed.draft)!==JSON.stringify(f.draft))throw Error('Production synthetic resume differs.');await api('save',{draft:f.draft,revision:0,progress:4},409);
   if(f.targetStatus==='completed'){await api('submit',{draft:f.draft,revision:1,progress:8});await api('save',{draft:f.draft,revision:2,progress:4},409);}
   await api('logout',{});await api('response',undefined,[401,429]);
  }finally{await query('DELETE FROM tb_baseline_sessions WHERE participant_id=?',[id]);await query('UPDATE tb_baseline_invites SET revoked_at=? WHERE invite_id=?',[new Date().toISOString(),invite]);}
 }
 const counts=await query('SELECT r.status,count(*) AS count FROM tb_baseline_responses r JOIN tb_baseline_participants p USING(participant_id) WHERE p.campaign_id=? GROUP BY r.status',[campaign]);const actual=Object.fromEntries(counts.map(x=>[x.status,x.count]));if(actual.completed!==32||actual.in_progress!==6||actual.not_started!==2)throw Error('Production synthetic totals differ.');
 const copies=await query('SELECT count(*) AS count FROM tb_baseline_answer_copies WHERE participant_id IN(SELECT participant_id FROM tb_baseline_participants WHERE campaign_id=?)',[campaign]);if(copies[0].count!==0)throw Error('Unexpected synthetic answer-copy outbox records.');
 console.log('Production synthetic backend checks passed: 40 participants; 32 submitted, 6 in progress, 2 not started. Save/resume, conflict rejection, locked submissions and logout checked. No email sent. Campaign '+campaign);
}else throw Error('Choose prepare, verify or seed.');
