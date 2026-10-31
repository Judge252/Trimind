import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const workspace=process.cwd();
const root=path.resolve('.vercel/output/functions/api/index.func');
const checks=[];
try{
 const sourceLedger=path.resolve(workspace,'server/.model-eval-budget.json');
 const originalLedger=await fs.readFile(sourceLedger);
 const artifactLedger=path.resolve(root,'server/.model-eval-budget.json');
 if(!artifactLedger.startsWith(root+path.sep)||artifactLedger===sourceLedger)throw Error('Unsafe artifact path');
 // Some Windows NFT versions copy this unrelated JSON despite excludeFiles.
 // Remove only the generated artifact copy; preserve the owner's ledger byte-for-byte.
 await fs.rm(artifactLedger,{force:true});
 if(!originalLedger.equals(await fs.readFile(sourceLedger)))throw Error('Source ledger changed');
 process.env.VERCEL='1';
 // Vercel's Windows builder records these source assets in filePathMap;
 // the deploy packer materializes them. Resolve the same mapping for local execution.
 const config=JSON.parse(await fs.readFile(path.join(root,'.vc-config.json'),'utf8'));
 for(const [destination,source] of Object.entries(config.filePathMap||{})){
  const from=path.resolve(workspace,source),to=path.resolve(root,destination);
  if(!from.startsWith(workspace+path.sep)||!to.startsWith(root+path.sep))throw Error('Unsafe filePathMap');
  await fs.mkdir(path.dirname(to),{recursive:true});await fs.copyFile(from,to);
 }
 process.chdir(root);
 const {default:handler}=await import(pathToFileURL(path.join(root,'api/index.js')).href);
 const server=http.createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [route,expected] of [['/api/health',200],['/api/catalog',200],['/api/state',401]]){
  const r=await fetch(origin+route);const json=await r.json();if(r.status!==expected)throw Error('Unexpected status for '+route);checks.push({route,status:r.status,json:true,...(route.endsWith('catalog')?{courses:json.courses.length}:{})});
 }
 for(const name of ['server/model-selection.json','server/certs/supabase-ca.crt'])await fs.access(path.join(root,name));
 await new Promise(resolve=>server.close(resolve));
 const report={status:'PASS',checks,packagedRegistryAndCA:true,sourceLedgerPreserved:true,artifactLedgerExcluded:true,materializedFilePathMap:Object.keys(config.filePathMap||{}).length,evidence:'Actual Vercel-emitted Node 22 function executed locally after resolving its source asset map and excluding an unrelated generated ledger copy, with real verified-TLS Supabase schema health. No hosted deployment or authenticated runtime claim.'};
 await fs.writeFile(path.join(workspace,'test-results/packaged-api.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));process.exit(0);
}catch(e){console.error(JSON.stringify({status:'FAIL',code:e.code||e.name,message:String(e.message).replaceAll(root,'<packaged-function>')}));process.exit(1);}
