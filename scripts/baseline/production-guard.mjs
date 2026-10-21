export function validateProductionBaselineApproval(approval,env,now=Date.now()) {
  const age=now-Date.parse(approval?.confirmedAt);
  if(env.GITHUB_REPOSITORY!=='gvanesch/fractional-hr-site'||env.GITHUB_REF!=='refs/heads/migration/d1'||env.CLOUDFLARE_ACCOUNT_ID!=='73221f18acc676e4992c89fcbf2b2a8f'||!env.CLOUDFLARE_API_TOKEN||approval?.approvedBy!=='Greg van Esch'||approval.scope!=='production-baseline-and-40-synthetic-responses-no-email'||approval.databaseId!=='b81b99d7-4b10-4f7e-a0c1-ada3adf596fc'||approval.participants!==40||approval.sendEmail!==false||!Number.isFinite(age)||age<0||age>86400000)throw Error('Exact production baseline approval is unavailable.');
}
export function validateSyntheticIdentity(profile) {
 if(!/^production-test-\d{2}@example\.invalid$/.test(profile.email)||!profile.name.startsWith('SYNTHETIC TEST '))throw Error('Synthetic test identity required.');
}
