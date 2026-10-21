// Pure synthetic fixtures. This file never connects to a service or sends mail.
const path = require('node:path');
const esbuild = require('esbuild');
async function fixtures() {
  const built = await esbuild.build({entryPoints:[path.resolve(__dirname,'../../lib/baseline/collection.ts')],bundle:true,platform:'node',format:'cjs',write:false});
  const model={exports:{}}; new Function('module','exports',built.outputFiles[0].text)(model,model.exports);
  const m=model.exports;
  const types=['people_operations','business_partnering','people_technology','reception','facilities','mixed','other'];
  const patterns=[['lifecycle','pay_benefits'],['advice_cases','planning_development'],['systems_data'],['office'],['office','policies'],['lifecycle','recruitment','experience'],['other']];
  const countries=['GB','SE','DE','NL','BE','IT','ES','CZ'];
  return Array.from({length:40},(_,i)=>{
    const manager=i%5===0;
    const profile={name:`SYNTHETIC TEST ${String(i+1).padStart(2,'0')}`,email:`production-test-${String(i+1).padStart(2,'0')}@example.invalid`,country:countries[i%8],region:['North','West','Central','South'][i%4],work_type:types[i%7],manages_people:manager?'yes':'no',direct_reports:manager?String(2+i%6):'0',entity:'SYNTHETIC TEST ONLY'};
    const d=m.initialCollection(m.FROZEN_COLLECTION_VERSION);d.started=true;
    d.broad.selected=[...patterns[i%7],...(manager?['people_management']:[])];
    let remainder=100;d.broad.selected.forEach((code,n)=>{const share=n===d.broad.selected.length-1?remainder:Math.floor(100/d.broad.selected.length);d.broad.time[code]=share;remainder-=share;d.broad.notes[code]='Synthetic backend test; no employee data.';});
    Object.assign(d.rich,{routes:i%2?['work_email','ticket']:['work_email'],routeTime:i%2?{work_email:60,ticket:40}:{work_email:100},recording:'none',duplicates:'rarely',sameRoutes:'same',scope:'one',systems:['excel'],localNeeds:[],strengths:'Synthetic test only.'});
    for(const code of ['advice_cases','planning_development'])if(d.broad.selected.includes(code))d.rich.workNature[code]='mixed';
    if(d.broad.selected.includes('pay_benefits')){
      for(const code of ['collect','prepare','submit_provider','check','queries'])d.rich.payrollStages[code]={mine:code==='submit_provider'?'coordinate':'do',others:code==='submit_provider'?['partner']:[]};
      d.rich.cycle='monthly';d.rich.days=2;
    }
    if(d.broad.selected.includes('systems_data'))Object.assign(d.technology,{involvement:'yes',activities:['support','reporting'],time:{run:50,improve:30,deliver:20},platforms:['hibob'],roles:{hibob:['admin']},partners:['unknown']});
    if(manager)d.managementTime={time:{coordination:25,individual:50,hiring:15,administration:10,other:0},uncertain:false,other:''};
    d.answerCopy=false;
    const context=m.managerRecord(profile);m.parseCollection(d,context);
    const issues=m.collectionIssues(d,context);if(issues.length)throw Error(`Fixture ${i+1}: ${issues.join(', ')}`);
    return {index:i+1,profile,manager:context,draft:d,targetStatus:i<32?'completed':i<38?'in_progress':'not_started'};
  });
}
module.exports={fixtures};
if(require.main===module)fixtures().then(rows=>console.log(JSON.stringify({participants:rows.length,statuses:rows.reduce((n,r)=>(n[r.targetStatus]=(n[r.targetStatus]||0)+1,n),{}),managers:rows.filter(r=>r.manager.isPeopleManager).length,workTypes:[...new Set(rows.map(r=>r.profile.work_type))],allEmailAddressesInvalid:rows.every(r=>r.profile.email.endsWith('@example.invalid')),answerCopiesRequested:rows.filter(r=>r.draft.answerCopy).length,networkRequests:0}))).catch(e=>{console.error(e.message);process.exitCode=1;});
