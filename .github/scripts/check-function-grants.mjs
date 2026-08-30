#!/usr/bin/env node
/**
 * Security gate for SECURITY DEFINER functions.
 *
 * 1) Static scan of supabase/migrations:
 *    - every `CREATE [OR REPLACE] FUNCTION public.x(...)` must be known in the allowlist
 *    - every `GRANT EXECUTE ON FUNCTION public.x(...) TO <role>` must match the allowlist
 *    - SECURITY DEFINER functions must set `search_path`
 * 2) Optional live check when SUPABASE_DB_URL is set: compares real ACLs against the
 *    allowlist through `psql`.
 *
 * Exit code 1 = new/changed exposure -> merge blocked.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const ALLOWLIST_PATH = path.join(ROOT, '.github/security/function-grants.json');
const MIGRATIONS_DIR = path.join(ROOT, 'supabase/migrations');
const RISKY_ROLES = new Set(['public', 'anon', 'authenticated']);

const allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')).functions;
const errors = [];
const warnings = [];

const allowedRoles = (fn) => new Set((allowlist[fn] ?? []).map((r) => r.toLowerCase()));

/* ---------------------------- 1. static scan ---------------------------- */

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const createRe = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-z0-9_]+)"?\s*\(/gi;
const grantRe =
  /grant\s+execute\s+on\s+function\s+(?:public\.)?"?([a-z0-9_]+)"?\s*\(([^)]*)\)\s*to\s+([^;]+);/gi;

for (const file of files) {
  const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

  for (const m of sql.matchAll(createRe)) {
    const fn = m[1].toLowerCase();
    if (!(fn in allowlist)) {
      errors.push(
        `${file}: function public.${fn}() is created but missing from ${path.relative(ROOT, ALLOWLIST_PATH)}. ` +
          `Add it with the exact roles it should be callable by (use [] for trigger-only functions).`,
      );
    }
    // SECURITY DEFINER without search_path is a privilege-escalation vector.
    const body = sql.slice(m.index, m.index + 4000).toLowerCase();
    if (body.includes('security definer') && !body.includes('search_path')) {
      errors.push(
        `${file}: public.${fn}() is SECURITY DEFINER but does not pin "set search_path".`,
      );
    }
  }

  for (const m of sql.matchAll(grantRe)) {
    const fn = m[1].toLowerCase();
    const roles = m[3]
      .split(',')
      .map((r) => r.trim().replace(/"/g, '').toLowerCase())
      .filter(Boolean);
    const allowed = allowedRoles(fn);
    for (const role of roles) {
      if (!(fn in allowlist)) continue; // already reported above
      if (!allowed.has(role)) {
        const severity = RISKY_ROLES.has(role) ? errors : warnings;
        severity.push(
          `${file}: GRANT EXECUTE on public.${fn}() TO ${role} is not in the allowlist ` +
            `(allowed: ${[...allowed].join(', ') || 'none'}).`,
        );
      }
    }
  }
}

/* ----------------------------- 2. live check ---------------------------- */

const dbUrl = process.env.SUPABASE_DB_URL;
if (dbUrl) {
  const query = `
    select p.proname,
           coalesce(array_to_string(array(
             select distinct g.grantee
             from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) a
             cross join lateral (
               select coalesce(nullif(split_part(a::text, '=', 1), ''), 'PUBLIC') as grantee
             ) g
           ), ','), '') as grantees
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
    order by 1;`;
  let out = '';
  try {
    out = execFileSync('psql', [dbUrl, '-At', '-F', '|', '-c', query], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    warnings.push(`Live grant check skipped: ${err.message.split('\n')[0]}`);
  }

  for (const line of out.split('\n').filter(Boolean)) {
    const [fn, granteeList] = line.split('|');
    const name = fn.toLowerCase();
    if (!(name in allowlist)) {
      errors.push(`live: public.${name}() exists in the database but is not in the allowlist.`);
      continue;
    }
    const allowed = allowedRoles(name);
    for (const grantee of (granteeList || '').split(',').filter(Boolean)) {
      const role = grantee.toLowerCase();
      if (role === 'postgres' || role === 'supabase_admin' || role === '') continue;
      if (!allowed.has(role)) {
        const bucket = RISKY_ROLES.has(role) ? errors : warnings;
        bucket.push(
          `live: public.${name}() is EXECUTE-able by "${role}" ` +
            `(allowed: ${[...allowed].join(', ') || 'none'}).`,
        );
      }
    }
  }
} else {
  warnings.push('SUPABASE_DB_URL not set — live database grant verification skipped.');
}

/* ------------------------------- report -------------------------------- */

for (const w of warnings) console.log(`::warning::${w}`);
for (const e of errors) console.log(`::error::${e}`);

console.log(
  `\nFunction grant gate: ${files.length} migrations scanned, ` +
    `${Object.keys(allowlist).length} allowlisted functions, ` +
    `${errors.length} error(s), ${warnings.length} warning(s).`,
);

if (errors.length) {
  console.log('\nMerge blocked: new or changed exposure on public schema functions.');
  process.exit(1);
}
console.log('No new exposure detected.');
