// One controlled QA transport probe. Never addresses a production Worker or database.
import {readFile} from 'node:fs/promises';
const account='73221f18acc676e4992c89fcbf2b2a8f',database='b25d59da-5f93-4301-9996-7be0c9708789';
const site=process.env.NEXT_PUBLIC_SITE_URL,credential=process.env.CLOUDFLARE_API_TOKEN;
if(process.env.GITHUB_REF!=='refs/heads/release/proxy-completion-candidate'||process.env.CLOUDFLARE_ACCOUNT_ID!==account||!credential||!/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(site??''))throw Error('Controlled QA transport context mismatch');
const config=JSON.parse(await readFile(new URL('../../wrangler.jsonc',import.meta.url),'utf8'));
if(config.env.qa.vars.CONTACT_TO_EMAIL!=='greg@vanesch.uk'||config.env.qa.d1_databases[0].database_id!==database)throw Error('QA recipient or database differs');
const settingsResponse=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fractional-hr-site-qa/settings`,{headers:{Authorization:'Bearer '+credential}});
if(!settingsResponse.ok)throw Error('QA settings unavailable');
const settings=await settingsResponse.json(),bindings=new Map((settings.result?.bindings??[]).map(x=>[x.name,x]));
if(!settings.success||bindings.get('CONTACT_TO_EMAIL')?.text!=='greg@vanesch.uk'||(bindings.get('DB')?.id??bindings.get('DB')?.database_id)!==database||bindings.get('NEXT_PUBLIC_APP_ENV')?.text!=='qa')throw Error('Deployed QA recipient, environment or DB differs');
async function query(sql,params=[]){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,{method:'POST',headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});if(!r.ok)throw Error('QA probe ledger unavailable');const b=await r.json();if(!b.success||b.result.some(x=>!x.success))throw Error('QA probe ledger failed');return b.result[0];}
const event='proxy-release-transport-probe-2026-10-29';
const claim=await query('INSERT OR IGNORE INTO tb_baseline_audit VALUES(?,NULL,?,?,NULL,?,?)',[event,'qa-release-workflow','controlled_transport_probe',JSON.stringify({status:'reserved',run:process.env.GITHUB_RUN_ID}),new Date().toISOString()]);
if(claim.meta.changes!==1){const previous=await query('SELECT metadata_json FROM tb_baseline_audit WHERE event_id=?',[event]);if(JSON.parse(previous.results[0]?.metadata_json??'{}').status==='accepted'){console.log('Existing controlled QA transport probe already accepted. No additional email sent.');process.exit(0);}throw Error('Probe already attempted; review before any retry');}
try{
 const r=await fetch(site+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Greg QA Test',email:'greg@vanesch.uk',company:'Van Esch Advisory QA',topic:'QA proxy release transport check',source:'qa-proxy-release-transport',message:'Synthetic controlled QA transport check for the on-behalf release candidate. This does not contain employee responses or require any action.'}),redirect:'manual',signal:AbortSignal.timeout(20000)});
 if(r.status!==200)throw Error('QA contact transport HTTP '+r.status);
 const b=await r.json();if(b.ok!==true||typeof b.resendId!=='string'||!b.resendId)throw Error('No provider acknowledgement');
 await query('UPDATE tb_baseline_audit SET metadata_json=? WHERE event_id=?',[JSON.stringify({status:'accepted',run:process.env.GITHUB_RUN_ID,providerId:b.resendId}),event]);
 console.log('One synthetic email to the verified QA mailbox accepted by the transport provider. Inbox delivery is not independently verified.');
}catch(e){await query('UPDATE tb_baseline_audit SET metadata_json=? WHERE event_id=?',[JSON.stringify({status:'failed_or_uncertain',run:process.env.GITHUB_RUN_ID}),event]);throw e;}
