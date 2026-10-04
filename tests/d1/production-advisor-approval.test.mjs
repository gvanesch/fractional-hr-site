import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAdvisorApproval, inspectAdvisorBindings} from '../../scripts/d1/configure-approved-production-advisor.mjs';
const approval = {approvedBy:'Greg van Esch',scope:'production-advisor-allowlist-only',accountId:'73221f18acc676e4992c89fcbf2b2a8f',worker:'fractional-hr-site',binding:'ADVISOR_ALLOWED_EMAILS',value:'greg@vanesch.uk',confirmedAt:'2026-10-04T14:23:27Z'};
const env = {GITHUB_REF:'refs/heads/migration/d1',GITHUB_REPOSITORY:'gvanesch/fractional-hr-site',CLOUDFLARE_ACCOUNT_ID:approval.accountId};
const now = Date.parse(approval.confirmedAt);
test('advisor configuration requires current exact approval and preserves existing login', () => {
  assert.doesNotThrow(()=>validateAdvisorApproval(approval,env,now));
  for (const field of ['approvedBy','scope','accountId','worker','binding','value'])
    assert.throws(()=>validateAdvisorApproval({...approval,[field]:'wrong'},env,now));
  assert.throws(()=>validateAdvisorApproval(approval,{...env,GITHUB_REF:'refs/heads/main'},now));
  assert.throws(()=>validateAdvisorApproval(approval,env,now+86400001));
  const bindings=[{name:'RESEND_API_KEY',type:'secret_text'}];
  assert.equal(inspectAdvisorBindings({bindings}).size,1);
  for (const item of [{name:'ADVISOR_ALLOWED_EMAILS',type:'secret_text'},{name:'ADVISOR_AUTH_MODE',text:'cloudflare_access'},{name:'D1_CLIENT_DIAGNOSTIC_MODE',text:'d1'}])
    assert.throws(()=>inspectAdvisorBindings({bindings:[...bindings,item]}));
});
