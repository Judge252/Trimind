import fs from 'node:fs';
import path from 'node:path';
/** Supabase's published database CA; hostname and chain validation remain enabled. */
export function connectionOptions(raw: string) {
  const url = new URL(raw);
  if (process.env.DATABASE_SSL !== 'true') return {connectionString: raw};
  for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n') ||
    (/\.supabase\.(com|co)$/.test(url.hostname) ? fs.readFileSync(path.resolve('server/certs/supabase-ca.crt'),'utf8') : undefined);
  return {connectionString:url.toString(),ssl:{rejectUnauthorized:true, ...(ca ? {ca}: {})}};
}
