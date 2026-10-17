import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transform} from 'esbuild';

const fixtureKey = 'sb_publishable_synthetic_build_fixture_only';
async function compiledModule(path, overrides) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const {code} = await transform(source, {loader:'ts',format:'cjs',target:'es2022',define:{'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY':JSON.stringify(fixtureKey)}});
  const module = {exports:{}};
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    process:{env:{}}, console:{error(){}},
  })(name => {
    if (!(name in overrides)) throw new Error('Unexpected import: '+name);
    return overrides[name];
  },module,module.exports);
  return module.exports;
}

test('built Supabase advisor authentication works without a runtime copy of the public build key', async () => {
  let clientCreated = false;
  const server = await compiledModule('../../lib/supabase/server.ts', {
    'next/headers':{cookies:async()=>({get:()=>({value:'synthetic-session-cookie'})})},
    '@/lib/supabase/environment':{getValidatedSupabaseUrl:()=> 'https://qxddddhhpfrrxbaunwfw.supabase.co'},
    '@supabase/ssr':{createServerClient:(url,key,options)=>{
      assert.equal(key,fixtureKey);
      assert.equal(url,'https://qxddddhhpfrrxbaunwfw.supabase.co');
      assert.equal(options.cookies.get('session'),'synthetic-session-cookie');
      clientCreated = true;
      return {auth:{getUser:async()=>({data:{user:{email:'greg@vanesch.uk'}},error:null})}};
    }},
  });
  const auth = await compiledModule('../../lib/advisor-auth.ts', {
    '@/lib/supabase/server':server,
    'next/headers':{},
    '@/lib/cloudflare-access':{isCloudflareAdvisorAuthEnabled:()=>false},
    '@/lib/advisor-access':{isAllowedAdvisorEmail:email=>email==='greg@vanesch.uk'},
  });
  const user = await auth.requireAdvisorUser();
  assert.equal(user?.email,'greg@vanesch.uk','A valid session must survive the advisor server check');
  assert.equal(clientCreated,true);
});
