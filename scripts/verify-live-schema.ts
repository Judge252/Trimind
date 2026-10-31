import pg from 'pg';
import fs from 'node:fs/promises';
import {connectionOptions} from '../server/connection';
const db=new pg.Client({...connectionOptions(process.env.DATABASE_URL!),connectionTimeoutMillis:10000});
try{
 await db.connect();
 const migrations=(await db.query('select version from public.trimind_migrations order by version')).rows;
 const tables=(await db.query("select relname as name,relrowsecurity as rls,relforcerowsecurity as forced from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r' order by relname")).rows;
 const privileges=(await db.query("select table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated') and privilege_type <> 'SELECT'")).rows;
 const role=(await db.query("select rolcanlogin,rolbypassrls from pg_roles where rolname='trimind_api'")).rows[0];
 const counts=(await db.query('select (select count(*)::int from auth.users) as accounts,(select count(*)::int from auth.users where email_confirmed_at is not null) as confirmed_accounts,(select count(*)::int from public.learning_plans) as plans,(select count(*)::int from public.assessment_drafts) as drafts')).rows[0];
 const report={checkedAt:new Date().toISOString(),tls:'chain and hostname verified',migrations,tables,unexpectedBrowserWrites:privileges,apiRole:role,counts};
 const generations=(await db.query('select status,model,prompt_tokens,completion_tokens,cost,error_code from public.ai_generations order by created_at')).rows;
 const progress=(await db.query('select (select count(*)::int from public.lesson_completions) as lessons,(select count(*)::int from public.quiz_attempts) as quizzes,(select count(*)::int from public.simulation_decisions) as decisions,(select count(*)::int from public.projects) as projects')).rows[0];
 const isolation:{role:string;visiblePlans:number;writeDenied?:boolean}[]=[];
 for(const roleName of ['authenticated','trimind_api']){
  await db.query('begin');await db.query('set local role '+roleName);await db.query("select set_config('request.jwt.claim.sub',$1,true)",[crypto.randomUUID()]);
  const visiblePlans=(await db.query('select count(*)::int as n from public.learning_plans')).rows[0].n;
  let writeDenied=false;
  if(roleName==='authenticated')try{await db.query("update public.catalog_courses set version='tamper-test' where false");}catch(e){writeDenied=(e as {code:string}).code==='42501';}
  await db.query('rollback');isolation.push({role:roleName,visiblePlans,...(roleName==='authenticated'?{writeDenied}:{})});
 }
 Object.assign(report,{generations,progress,isolation,evidenceNote:'RLS checked on live SQL using non-owner claim contexts; not proof of two distinct signed-in account sessions.'});
 await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/live-schema.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(privileges.length || tables.some(t=>!t.rls||!t.forced)||role.rolcanlogin||role.rolbypassrls)process.exitCode=1;
}catch(e){console.log(JSON.stringify({status:'FAILED',code:(e as {code?:string}).code||'configuration'}));process.exitCode=1;}finally{await db.end().catch(()=>{});}
