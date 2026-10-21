const {test}=require('node:test');
const assert=require('node:assert/strict');
const esbuild=require('esbuild');
const {execFileSync}=require('node:child_process');
async function load(file){const b=await esbuild.build({entryPoints:[require('node:path').resolve(__dirname,'../../'+file)],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports',b.outputFiles[0].text)(m,m.exports);return m.exports;}
async function sample(){const c=await load('lib/baseline/collection.ts');const {fixtures}=require('../../scripts/baseline/production-fixtures.cjs');const rows=await fixtures();return {campaign:{name:'[SYNTHETIC TEST] 40 participants'},respondents:rows.map(f=>({...f.profile,participant_id:'person-'+f.index,campaign_id:'sample',questionnaire_version:c.FROZEN_COLLECTION_VERSION,status:f.targetStatus,working_fraction:1,contracted_hours:40,...c.collectionEvidence(f.targetStatus==='not_started'?c.initialCollection(c.FROZEN_COLLECTION_VERSION):f.draft,f.manager)}))};}
test('Analysis workbook separates 40 respondents from 73 work rows and keeps denominators and missing values correct',async()=>{
 const {analysisTables}=await load('lib/baseline/analysis-export.ts');const tables=analysisTables(await sample());const t=n=>tables.find(t=>t.name===n);const at=(t,r,c)=>r[t.columns.indexOf(c)];
 assert.equal(t('Respondents').rows.length,40);assert.equal(t('Work allocation').rows.length,73);
 assert.equal(t('Respondents').rows.filter(r=>at(t('Respondents'),r,'Include in analysis')).length,32);
 const group=t('Management time').rows.find(r=>at(t('Management time'),r,'Participant ID')==='person-1'&&at(t('Management time'),r,'Activity code')==='individual');
 assert.equal(at(t('Management time'),group,'Share of management time'),.5);assert.equal(at(t('Management time'),group,'Share of working time'),.17);assert.ok(Math.abs(at(t('Management time'),group,'Hours per week')-6.8)<1e-10);assert.equal(at(t('Management time'),group,'FTE allocation'),.17);
 assert.equal(t('Payroll stages').rows.length,30);assert.equal(t('Technology time').rows.length,18);
 for(const tb of tables)for(const row of tb.rows){assert.equal(row.length,tb.columns.length,tb.name);assert.ok(row.every(v=>v===null||['string','number','boolean'].includes(typeof v)));}
 const d=await sample();d.respondents[0].contracted_hours='';d.respondents[0].working_fraction='';d.respondents[0].systems=['unknown'];
 const changed=analysisTables(d);const work=changed.find(t=>t.name==='Work allocation');assert.equal(work.rows[0][work.columns.indexOf('Hours per week')],null);assert.equal(work.rows[0][work.columns.indexOf('FTE allocation')],null);
 const resp=changed.find(t=>t.name==='Respondents');assert.equal(resp.rows[0][resp.columns.indexOf('Uses: HiBob')],null);assert.equal(resp.rows[0][resp.columns.indexOf('Uses: Not sure')],true);
});
test('XLSX download is a valid typed OOXML package with filterable tables, frozen headers and literal answers',async()=>{
 const {analysisTables}=await load('lib/baseline/analysis-export.ts');const {analysisXlsx}=await load('lib/baseline/analysis-xlsx.ts');const data=await sample();data.respondents[0].strengths='=HYPERLINK("bad") & café <test>';
 const b=analysisXlsx(analysisTables(data));assert.deepEqual([...b.slice(0,2)],[80,75]);
 const result=execFileSync('python3',['-c',`import sys,io,zipfile,xml.etree.ElementTree as E,json
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));assert z.testzip() is None
for name in z.namelist(): E.fromstring(z.read(name))
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
wb=E.fromstring(z.read('xl/workbook.xml'));assert len(wb.find('s:sheets',ns))==14
allxml=''.join(z.read(n).decode() for n in z.namelist() if n.endswith('.xml'))
assert '=HYPERLINK' in allxml and '&amp;' in allxml and 'café' in allxml
assert '<f>' not in allxml
assert 'state="frozen"' in allxml and '<autoFilter' in allxml
assert 't="b"' in allxml and 'numFmtId="10"' in allxml
print('OOXML integrity, Unicode, typed values, table ranges, freeze panes and formula-injection boundaries passed.')`],{input:Buffer.from(b)}).toString();assert.match(result,/passed/);
});
