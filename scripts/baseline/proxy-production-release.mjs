// Code-only release. Runtime checkpoints stay in the runner; no response data is exported.
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyProductionPublicKey} from '../d1/verify-production-public-key.mjs';
const configPath = new URL('../../wrangler.jsonc', import.meta.url);
const config = JSON.parse(await readFile(configPath));
const account = process.env.CLOUDFLARE_ACCOUNT_ID, worker = config.name;
const database = config.d1_databases.find(x => x.binding === 'DB').database_id;
const checkpoint = new URL('../../proxy-production-checkpoint.json', import.meta.url);
const approval = JSON.parse(await readFile(new URL('./proxy-production-approval.json', import.meta.url)));
const reviewed = '7f4548bfd263c963671af61d26ea69f613c802ad';
if (process.env.GITHUB_REPOSITORY !== 'gvanesch/fractional-hr-site' || process.env.GITHUB_REF !== 'refs/heads/migration/d1' || !process.env.CLOUDFLARE_API_TOKEN || approval.reviewedCommit !== reviewed || approval.approvedBy !== 'Greg van Esch' || approval.scope !== 'production-proxy-code-release' || Date.now()-Date.parse(approval.confirmedAt) < 0 || Date.now()-Date.parse(approval.confirmedAt) > 86400000 || !Number.isFinite(Date.parse(approval.confirmedAt))) throw Error('Current release approval unavailable');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function cf(path, body) {
 const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, {method:body?'POST':'GET', headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN, ...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 if(!r.ok) throw Error('Cloudflare operation failed: '+r.status);
 const b=await r.json(); if(!b.success) throw Error('Cloudflare operation rejected'); return b.result;
}
const root=`workers/scripts/${worker}`;
async function state(){
 const s=await cf(root+'/settings'), d=(await cf(root+'/deployments')).deployments[0];
 if(d.versions.length!==1||d.versions[0].percentage!==100) throw Error('Unexpected production traffic split');
 const bindings=[...s.bindings].sort((a,b)=>a.name.localeCompare(b.name));
 const map=new Map(bindings.map(b=>[b.name,b]));
 if((map.get('DB')?.id??map.get('DB')?.database_id)!==database||map.get('BASELINE_ENABLED')?.text!=='true'||map.get('BASELINE_MAIL_MODE')?.text!=='send'||(map.get('ADVISOR_AUTH_MODE')?.text??'supabase')!=='supabase'||map.get('BASELINE_PROXY_CAMPAIGN_IDS')?.text?.trim()) throw Error('Production isolation, storage, mail or authentication differs');
 return {deployment:d,bindings,fingerprint:digest(bindings)};
}
async function smoke(){
 for(const [path,status] of [['/api/baseline/response',401],['/advisor/baseline/api/campaigns',401]]){
  const r=await fetch('https://www.vanesch.uk'+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});
  await r.body?.cancel(); if(![status,302,307].includes(r.status)) throw Error('Protected route check failed');
 }
 const r=await fetch('https://www.vanesch.uk/baseline/start',{redirect:'follow',signal:AbortSignal.timeout(20000)}); const html=await r.text();
 if(r.status!==200||!html.includes('baseline')) throw Error('Assessment entry check failed');
}
const mode=process.argv[2];
if(mode==='prepare'){
 const changed=execFileSync('git',['diff','--name-only',reviewed,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allowed=['scripts/baseline/proxy-production-release.mjs','scripts/baseline/proxy-production-approval.json','.github/workflows/proxy-production.yml'];
 if(changed.some(p=>!allowed.includes(p))) throw Error('Application differs from tested source');
 const qr=await fetch(`https://api.github.com/repos/gvanesch/fractional-hr-site/actions/runs/${approval.qaRunId}`,{headers:{Authorization:'Bearer '+process.env.GH_TOKEN},signal:AbortSignal.timeout(15000)});
 if(!qr.ok) throw Error('QA evidence unavailable'); const qa=await qr.json();
 if(qa.head_sha!==reviewed||qa.conclusion!=='success'||qa.path!=='.github/workflows/proxy-release-candidate-qa.yml') throw Error('Exact QA evidence differs');
 await verifyProductionPublicKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 const s=await state();
 const expected=(await readFile(new URL('../security/production-recovery-readonly.mjs',import.meta.url),'utf8')).match(/version_id !== "([a-f0-9-]+)"/)[1];
 if(s.deployment.versions[0].version_id!==expected) throw Error('Production moved since reviewed checkpoint');
 await cf(root+'/versions/'+expected);
 const recovery=await cf(`d1/database/${database}/time_travel/bookmark`);
 if(!recovery.bookmark) throw Error('Recovery checkpoint unavailable');
 await smoke();
 await writeFile(checkpoint,JSON.stringify(s),{mode:0o600});
 config.account_id=account;
 config.vars=Object.fromEntries(s.bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 await writeFile(configPath,JSON.stringify(config,null,2)+'\n');
 console.log('Exact QA source, unchanged production configuration, previous application version and database recovery checkpoint verified. No production writes.');
}else if(mode==='verify'){
 const prior=JSON.parse(await readFile(checkpoint)); const current=await state();
 if(current.deployment.id===prior.deployment.id||current.fingerprint!==prior.fingerprint) throw Error('Release or unchanged bindings check failed');
 await smoke();
 console.log('Production code release verified. All existing bindings, mail settings, authentication and project isolation preserved. No database writes or email sends.');
}else if(mode==='rollback'){
 const prior=JSON.parse(await readFile(checkpoint));
 const current=await state();
 if(current.deployment.versions[0].version_id!==prior.deployment.versions[0].version_id){
  await cf(root+'/deployments',{strategy:'percentage',versions:prior.deployment.versions,annotations:{'workers/message':'Restore pre-release application after failed release checks'}});
 }
 const after=await state();
 if(after.deployment.versions[0].version_id!==prior.deployment.versions[0].version_id||after.fingerprint!==prior.fingerprint) throw Error('Rollback verification failed');
 console.log('Previous application restored. Database responses preserved; no database snapshot restored.');
}else throw Error('Choose prepare, verify or rollback');
