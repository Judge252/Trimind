import pg from 'pg';
import {connectionOptions} from '../server/connection.ts';
const target = new URL(process.env.DATABASE_URL);
console.log(JSON.stringify({ targetLooksSupabase: /supabase/.test(target.hostname), tlsRequested: process.env.DATABASE_SSL === 'true', publicUrlMatches: process.env.SUPABASE_URL === process.env.VITE_SUPABASE_URL, publicKeyMatches: process.env.SUPABASE_PUBLISHABLE_KEY === process.env.VITE_SUPABASE_PUBLISHABLE_KEY }));
const db = new pg.Client({...connectionOptions(process.env.DATABASE_URL), connectionTimeoutMillis:10000});
try {
 await db.connect();
 console.log(JSON.stringify({database:'connected',... (await db.query("select current_user as role,exists(select 1 from pg_namespace where nspname='auth') as auth_schema,to_regclass('public.trimind_migrations') is not null as receipts,to_regclass('public.assessment_drafts') is not null as drafts,(select count(*)::int from information_schema.tables where table_schema='public') as public_table_count")).rows[0]}));
 if ((await db.query("select to_regclass('public.trimind_migrations') is not null as ready")).rows[0].ready) console.log(JSON.stringify({migrations:(await db.query('select version from public.trimind_migrations order by version')).rows}));
} catch(e) { console.log(JSON.stringify({database:'FAILED',code:e.code || 'configuration',reason:e.code==='SELF_SIGNED_CERT_IN_CHAIN'?'certificate-chain':undefined})); }
finally {await db.end().catch(()=>{});}
for (const route of ['/','/login','/api/health','/api/catalog']) {
 try {const r=await fetch('https://trimind-xi.vercel.app'+route); const text=await r.text(); console.log(JSON.stringify({liveRoute:route,status:r.status,type:r.headers.get('content-type'),asset:text.match(/src="([^\"]+\.js)"/)?.[1],phaseOne:/Phase 1/.test(text),json:!!r.headers.get('content-type')?.includes('application/json')}));}catch{console.log(JSON.stringify({liveRoute:route,status:'network-failed'}));}
}
try {const r=await fetch(process.env.SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY}});const s=await r.json();console.log(JSON.stringify({authSettingsStatus:r.status,google:s.external?.google,email:s.external?.email,signupDisabled:s.disable_signup,autoconfirm:s.mailer_autoconfirm}));}catch{console.log('Auth settings network failed');}
