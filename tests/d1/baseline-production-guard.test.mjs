import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateProductionBaselineApproval,validateSyntheticIdentity} from '../../scripts/baseline/production-guard.mjs';
const now=Date.parse('2026-10-16T20:00:00Z');
const env={GITHUB_REPOSITORY:'gvanesch/fractional-hr-site',GITHUB_REF:'refs/heads/migration/d1',CLOUDFLARE_ACCOUNT_ID:'73221f18acc676e4992c89fcbf2b2a8f',CLOUDFLARE_API_TOKEN:'synthetic-test-credential'};
const approval={approvedBy:'Greg van Esch',scope:'production-baseline-and-40-synthetic-responses-no-email',databaseId:'b81b99d7-4b10-4f7e-a0c1-ada3adf596fc',participants:40,sendEmail:false,confirmedAt:'2026-10-16T19:51:59Z'};
test('Production synthetic baseline guard rejects wrong targets, stale approval, counts and email sending',()=>{
 assert.doesNotThrow(()=>validateProductionBaselineApproval(approval,env,now));
 for(const patch of [{databaseId:'qa-database'},{participants:50},{sendEmail:true},{confirmedAt:'2026-10-14T00:00:00Z'},{confirmedAt:'2026-10-17T00:00:00Z'},{scope:'send-real-invitations'}])assert.throws(()=>validateProductionBaselineApproval({...approval,...patch},env,now));
 for(const patch of [{GITHUB_REPOSITORY:'other/repo'},{GITHUB_REF:'refs/heads/main'},{CLOUDFLARE_ACCOUNT_ID:'wrong'},{CLOUDFLARE_API_TOKEN:''}])assert.throws(()=>validateProductionBaselineApproval(approval,{...env,...patch},now));
});
test('Synthetic production batch refuses real mailboxes and unlabelled profiles',()=>{
 assert.doesNotThrow(()=>validateSyntheticIdentity({name:'SYNTHETIC TEST 01',email:'production-test-01@example.invalid'}));
 assert.throws(()=>validateSyntheticIdentity({name:'SYNTHETIC TEST 01',email:'greg@vanesch.uk'}));
 assert.throws(()=>validateSyntheticIdentity({name:'Unlabelled person',email:'production-test-01@example.invalid'}));
});
