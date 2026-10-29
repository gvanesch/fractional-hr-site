// This fixture can only address the named QA Worker and QA D1 database.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const account='73221f18acc676e4992c89fcbf2b2a8f', database='b25d59da-5f93-4301-9996-7be0c9708789';
const site=process.env.NEXT_PUBLIC_SITE_URL, credential=process.env.CLOUDFLARE_API_TOKEN;
if(!['refs/heads/qa/proxy-completion','refs/heads/release/proxy-completion-candidate'].includes(process.env.GITHUB_REF)||process.env.CLOUDFLARE_ACCOUNT_ID!==account||!credential||!/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(site??'')) throw Error('Isolated proxy QA target required');
const built=await require('esbuild').build({entryPoints:[new URL('../../lib/baseline/collection.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'cjs',write:false});
const mod={exports:{}};new Function('module','exports',built.outputFiles[0].text)(mod,mod.exports);const m=mod.exports;
async function query(sql,params=[]){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,{method:'POST',headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});if(!r.ok)throw Error('QA query HTTP '+r.status);const b=await r.json();if(!b.success||b.result.some(x=>!x.success))throw Error('QA fixture query failed');return b.result[0].results;}
const campaign=randomUUID(),stamp=new Date().toISOString(),expires=new Date(Date.now()+3600000).toISOString(),hash=v=>createHash('sha256').update(v).digest('hex');
const records=['Synthetic Anne','Synthetic Charlotte'].map((name,i)=>({id:randomUUID(),invite:randomUUID(),session:randomBytes(32).toString('hex'),token:randomBytes(32).toString('hex'),name,email:`proxy-role-${i}-${randomUUID()}@example.invalid`}));
let cookie='';
async function api(path,body,expected=200){const r=await fetch(site+'/api/baseline/'+path,{method:body?'POST':'GET',headers:{Origin:site,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual'});assert.equal(r.status,expected,'QA '+path+' status');if(expected!==200){await r.body?.cancel();return;}return r.json();}
try{
 await query('INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)',[m.DEPTH_COLLECTION_VERSION,JSON.stringify(m.collectionDefinitionFor(m.DEPTH_COLLECTION_VERSION)),stamp]);
 await query('INSERT INTO tb_baseline_campaigns VALUES(?,?,?,?,?,?,?,?,?)',[campaign,'Synthetic QA on-behalf contract',m.DEPTH_COLLECTION_VERSION,'open',expires,'Synthetic QA evidence only. Completed on behalf.',90,stamp,'[]']);
 for(const r of records){
  await query('INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)',[r.id,campaign,r.email,JSON.stringify({name:r.name,email:r.email,country:'DK',region:'QA',manages_people:'no',direct_reports:'0'}),stamp]);
  await query('INSERT INTO tb_baseline_roster_details VALUES(?,?,?)',[r.id,JSON.stringify({response_source:'proxy',completer_name:'Synthetic Manager',completer_email:'manager@example.invalid',reference_period:'Usual role before absence',proxy_note:'Synthetic coverage gap'}),stamp]);
  await query('INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)',[r.id,m.DEPTH_COLLECTION_VERSION,'not_started',randomUUID(),JSON.stringify(m.initialCollection(m.DEPTH_COLLECTION_VERSION)),stamp]);
  await query('INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)',[r.invite,r.id,hash(r.token),expires,stamp]);
  await query('INSERT INTO tb_baseline_sessions VALUES(?,?,?,?,?)',[hash(r.session),r.id,r.invite,expires,stamp]);
 }
 const draft=m.initialCollection(m.DEPTH_COLLECTION_VERSION);draft.started=true;draft.broad.selected=['office'];draft.broad.time={office:100};draft.managementTime={time:{},uncertain:false,other:''};require('./depth-fixture.cjs').fillDepth(draft);Object.assign(draft.rich,{routes:['work_email'],routeTime:{work_email:100},recording:'none',duplicates:'rarely',sameRoutes:'same',scope:'one',localNeeds:[],systems:['excel']});draft.answerCopy=true;
 for(const r of records){
  cookie='__Host-tb_baseline='+r.session;
  const saved=await api('response');assert.equal(saved.campaign.participantId,r.id);assert.equal(saved.campaign.attribution.participantName,r.name);assert.equal(saved.campaign.attribution.completerEmail,'manager@example.invalid');assert.equal(saved.draft.version,m.DEPTH_COLLECTION_VERSION);
  await api('request-code',{token:r.token},403);
  await api('save',{draft,revision:0,progress:4},409);
  await api('save',{participantId:records.find(x=>x!==r).id,draft,revision:0,progress:4},409);
  await api('save',{participantId:r.id,draft,revision:0,progress:4});
  assert.equal((await api('response')).revision,1);
  await api('submit',{participantId:r.id,draft,revision:1,progress:8});
  await api('save',{participantId:r.id,draft,revision:2,progress:4},409);
 }
 const copies=await query('SELECT a.recipient_email,a.status,r.status AS response_status FROM tb_baseline_answer_copies a JOIN tb_baseline_responses r USING(participant_id) JOIN tb_baseline_participants p USING(participant_id) WHERE p.campaign_id=?',[campaign]);
 assert.equal(copies.length,2);assert.ok(copies.every(r=>r.recipient_email==='manager@example.invalid'&&r.status==='preview'&&r.response_status==='completed'));
 const audits=await query("SELECT metadata_json FROM tb_baseline_audit WHERE campaign_id=? AND action='submitted'",[campaign]);assert.equal(audits.length,2);assert.ok(audits.every(r=>JSON.parse(r.metadata_json).responseSource==='proxy'));
 console.log('Hosted QA passed: separate on-behalf identities, shared completer mailbox, independent sessions, stale-tab rejection, save/resume/submission, immutable answers, attribution audit, preview-only answer copies. No emails sent.');
}finally{await query("UPDATE tb_baseline_campaigns SET status='closed' WHERE campaign_id=?",[campaign]);for(const r of records)await query('DELETE FROM tb_baseline_sessions WHERE participant_id=?',[r.id]);}
