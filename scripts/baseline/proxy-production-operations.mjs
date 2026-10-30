// Scoped activation and code rollback. Never logs roster, settings, links or response data.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const config=JSON.parse(await readFile(new URL('../../wrangler.jsonc',import.meta.url)));
const approval=JSON.parse(await readFile(new URL('./proxy-operations-approval.json',import.meta.url)));
const age=Date.now()-Date.parse(approval.confirmedAt);
if(process.env.GITHUB_REPOSITORY!=='gvanesch/fractional-hr-site'||process.env.GITHUB_REF!=='refs/heads/migration/d1'||approval.approvedBy!=='Greg van Esch'||approval.scope!=='two-supplementary-proxy-projects'||!['enable','rollback'].includes(approval.action)||!Number.isFinite(age)||age<0||age>86400000) throw Error('Current scoped operations approval unavailable');
const account=process.env.CLOUDFLARE_ACCOUNT_ID,worker=config.name,database=config.d1_databases.find(d=>d.binding==='DB').database_id;
const root=`workers/scripts/${worker}`;
async function cf(path,body,method){
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`,{method:method??(body?'POST':'GET'),headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Scoped operation HTTP '+r.status); const b=await r.json();if(!b.success)throw Error('Scoped operation rejected');return b.result;
}
async function query(sql,params=[]){const result=await cf(`d1/database/${database}/query`,{sql,params});if(result.some(r=>!r.success))throw Error('Scoped project query failed');return result[0].results;}
const names=['Denmark: supplementary role baseline','Turkey: supplementary role baseline'];
const projects=await query('SELECT * FROM tb_baseline_campaigns WHERE name IN (?,?)',names);
if(projects.length!==2||new Set(projects.map(p=>p.name)).size!==2||projects.some(p=>p.version!=='team-blue-baseline-v5'||p.closes_at!=='2026-11-05T18:00:00.000Z'))throw Error('Exactly two reviewed supplementary projects required');
const ids=projects.map(p=>p.campaign_id).sort();
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const main=()=>query('SELECT * FROM tb_baseline_campaigns WHERE campaign_id NOT IN (?,?) ORDER BY campaign_id',ids);
const mainBefore=digest(await main());
async function settings(){const s=await cf(root+'/settings');return s.bindings.sort((a,b)=>a.name.localeCompare(b.name));}
const before=await settings();const binding=before.find(b=>b.name==='DB');
if((binding?.id??binding?.database_id)!==database||before.find(b=>b.name==='BASELINE_MAIL_MODE')?.text!=='send')throw Error('Production data or mail settings differ');
const other=bindings=>digest(bindings.filter(b=>b.name!=='BASELINE_PROXY_CAMPAIGN_IDS'));
if(approval.action==='enable'){
 if(projects.some(p=>p.status!=='draft')||before.some(b=>b.name==='BASELINE_PROXY_CAMPAIGN_IDS'))throw Error('Project activation already attempted; inspect instead of repeating');
 const rows=await query('SELECT participant_id FROM tb_baseline_participants WHERE campaign_id IN (?,?)',ids);if(rows.length)throw Error('Supplementary projects must be empty before scoped activation');
 const live=(await cf(root+'/deployments')).deployments[0];
 if(live.versions.length!==1||live.versions[0].version_id!==approval.expectedVersionId||live.versions[0].percentage!==100)throw Error('Reviewed application version differs');
 const result=await cf(root+'/secrets',{name:'BASELINE_PROXY_CAMPAIGN_IDS',text:ids.join(','),type:'secret_text'},'PUT');
 if(result.name!=='BASELINE_PROXY_CAMPAIGN_IDS')throw Error('Activation binding not acknowledged');
 const after=await settings();if(other(before)!==other(after)||!after.some(b=>b.name==='BASELINE_PROXY_CAMPAIGN_IDS'))throw Error('Unrelated settings changed');
 console.log('On-behalf completion enabled for exactly the two empty supplementary projects. All other bindings and campaign settings preserved. No email sent.');
}else{
 // Close and invalidate only the two supplementary projects before restoring old code.
 for(const id of ids){
  await query("UPDATE tb_baseline_campaigns SET status='closed' WHERE campaign_id=?",[id]);
  await query('UPDATE tb_baseline_invites SET revoked_at=? WHERE revoked_at IS NULL AND participant_id IN (SELECT participant_id FROM tb_baseline_participants WHERE campaign_id=?)',[new Date().toISOString(),id]);
  await query('DELETE FROM tb_baseline_sessions WHERE participant_id IN (SELECT participant_id FROM tb_baseline_participants WHERE campaign_id=?)',[id]);
 }
 const expected=(await readFile(new URL('../security/production-recovery-readonly.mjs',import.meta.url),'utf8')).match(/version_id !== "([a-f0-9-]+)"/)[1];
 await cf(root+'/versions/'+expected);
 await cf(root+'/deployments',{strategy:'percentage',versions:[{version_id:expected,percentage:100}],annotations:{'workers/message':'Rollback supplementary proxy release; preserve response database'}});
 const live=(await cf(root+'/deployments')).deployments[0];if(live.versions.length!==1||live.versions[0].version_id!==expected)throw Error('Application rollback verification failed');
 console.log('Supplementary projects closed and their access revoked. Previous application restored. All assessment responses preserved; no database snapshot restored.');
}
if(digest(await main())!==mainBefore)throw Error('Unrelated campaign settings changed during scoped operation');
console.log('All other campaign settings verified unchanged.');
