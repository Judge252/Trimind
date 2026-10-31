import fs from 'node:fs/promises';
import path from 'node:path';
const values=[process.env.OPENROUTER_API_KEY,process.env.DATABASE_URL].filter(Boolean);
if(values.length!==2)throw Error('Both private environment settings must be loaded for the scan.');
const findings=[];let files=0;
async function scan(root){for(const entry of await fs.readdir(root,{withFileTypes:true})){
 const file=path.join(root,entry.name);
 if(entry.isDirectory()){if(entry.name!=='node_modules')await scan(file);continue;}
 if(entry.name==='.env'||entry.name.startsWith('.env.'))findings.push({file,kind:'environment-file'});
 if(!/\.(js|mjs|cjs|json|map|css|html)$/.test(entry.name))continue;
 const text=await fs.readFile(file,'utf8');files++;if(values.some(v=>text.includes(v)))findings.push({file,kind:'private-value'});
}}
await scan('dist');await scan('.vercel/output');
const report={status:findings.length?'FAIL':'PASS',filesScanned:files,privateSettingsChecked:2,nodeModulesSkipped:true,findings};
await fs.writeFile('test-results/secret-scan.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(findings.length)process.exitCode=1;
