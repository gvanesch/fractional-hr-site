const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { execFileSync } = require("node:child_process"),
  path = require("node:path");
test("Reserved QA demo seed creates 20 valid synthetic records and can be rerun without overwriting answers", () => {
  const script = path.resolve(
      __dirname,
      "../../scripts/baseline/demo-seed.mjs",
    ),
    root = path.resolve(__dirname, "../..");
  const result = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
 import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {pathToFileURL} from 'node:url';
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');for(const file of ['0001_baseline.sql','0002_campaign_entities.sql','0003_administration.sql'])db.exec(readFileSync(${JSON.stringify(root)}+'/baseline-migrations/'+file,'utf8'));
 Object.assign(process.env,{CLOUDFLARE_ACCOUNT_ID:'73221f18acc676e4992c89fcbf2b2a8f',CLOUDFLARE_API_TOKEN:'synthetic-seed',NEXT_PUBLIC_SITE_URL:'https://fractional-hr-site-qa.synthetic.workers.dev',GITHUB_REF:'refs/heads/feature/team-blue-baseline'});
 globalThis.fetch=async(url,options)=>{if(!String(url).includes('/d1/database/b25d59da-5f93-4301-9996-7be0c9708789/query'))throw new Error('Non-QA request');const {sql,params}=JSON.parse(options.body);const results=db.prepare(sql).all(...params);return new Response(JSON.stringify({success:true,result:[{success:true,results}]}),{status:200});};
 await import(pathToFileURL(${JSON.stringify(script)}));
 const first=db.prepare('SELECT COUNT(*) AS n FROM tb_baseline_participants').get().n;if(first!==20)throw new Error('Incorrect roster count');
 const original=db.prepare('SELECT draft_json FROM tb_baseline_responses ORDER BY participant_id LIMIT 1').get().draft_json;
 await import(pathToFileURL(${JSON.stringify(script)})+'?repeat');
 if(db.prepare('SELECT COUNT(*) AS n FROM tb_baseline_participants').get().n!==20)throw new Error('Duplicate records');if(db.prepare('SELECT draft_json FROM tb_baseline_responses ORDER BY participant_id LIMIT 1').get().draft_json!==original)throw new Error('Answers overwritten');
 console.log('LOCAL_SEED_VERIFIED');db.close();
 `,
    ],
    { encoding: "utf8", timeout: 30000 },
  );
  assert.ok(result.includes("LOCAL_SEED_VERIFIED"));
  assert.ok(result.includes('"completed":15'));
  assert.ok(result.includes('"inProgress":3'));
  assert.ok(result.includes('"notStarted":2'));
});
