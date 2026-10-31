import fs from 'node:fs/promises';
import path from 'node:path';
const auth=JSON.parse(await fs.readFile(path.join(process.env.APPDATA,'com.vercel.cli/Data/auth.json'),'utf8'));
const headers={Authorization:'Bearer '+auth.token};
const r=await fetch('https://api.vercel.com/v9/projects/trimind',{headers});
if(!r.ok){console.log(JSON.stringify({vercelAccess:r.status}));process.exitCode=1;}else{
 const p=await r.json();
 const env=await fetch(`https://api.vercel.com/v10/projects/${p.id}/env?teamId=${p.accountId}`,{headers}).then(r=>r.json());
 const report={checkedAt:new Date().toISOString(),project:p.name,framework:p.framework,buildCommand:p.buildCommand,outputDirectory:p.outputDirectory,rootDirectory:p.rootDirectory,git:p.link?{type:p.link.type,repo:p.link.repo,productionBranch:p.link.productionBranch}:null,environmentNames:(env.envs||[]).map(e=>({key:e.key,target:e.target})),production:p.targets?.production?{url:p.targets.production.url,readyState:p.targets.production.readyState,createdAt:p.targets.production.createdAt,commit:p.targets.production.meta?.githubCommitSha}:null};
 await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/release-inspection.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 await fs.mkdir('.tmp',{recursive:true});await fs.writeFile('.tmp/release-target.json',JSON.stringify({projectId:p.id,orgId:p.accountId}));
}
const html=await fetch('https://trimind-xi.vercel.app/').then(r=>r.text());const asset=html.match(/src="([^\"]+\.js)"/)?.[1];
if(asset){const js=await fetch('https://trimind-xi.vercel.app'+asset).then(r=>r.text());console.log(JSON.stringify({liveAsset:asset,phaseOneFooter:js.includes('Phase 1'),longAssessment:js.includes('20 short questions'),previewLogin:js.includes('preview')}));}
