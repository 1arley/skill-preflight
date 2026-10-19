#!/usr/bin/env node
import fs from 'node:fs';
import { loadContext } from './context.js';
import { isEntry } from './entry.js';
import { ALL_RULES, isAgensiRule, selectRules } from './rules.js';
import { buildReport, renderReport, type Format } from './report.js';
import type { Finding } from './types.js';

type Args = { target: string; profile: 'default'|'strict'|'agensi'; format: Format; strict: boolean; only: string[]; skip: string[]; explain?: string; ignore?: string; out?: string };
const USAGE = 'Usage: node scripts/preflight.mjs <skill-directory> [--profile default|strict|agensi] [--format text|json|sarif|md] [--strict] [--ignore-file FILE] [--only ID,...] [--skip ID,...] [--explain ID] [--out FILE]';
function parse(argv: string[]): Args { let target = ''; let profile: Args['profile'] = 'default', format: Args['format'] = 'text', strict = false, only: string[] = [], skip: string[] = []; let ignore: string | undefined, out: string | undefined, explain: string | undefined;
  for (let i = 0; i < argv.length; i++) { const a = argv[i]!; const value = () => { const v = argv[++i]; if (!v) throw new UsageError(`Missing value for ${a}`); return v; };
    switch (a) { case '--profile': { const v = value(); if (!['default','strict','agensi'].includes(v)) throw new UsageError(`Unknown profile: ${v}`); profile = v as Args['profile']; break; } case '--format': { const v = value(); if (!['text','json','sarif','md'].includes(v)) throw new UsageError(`Unknown format: ${v}`); format = v as Args['format']; break; } case '--strict': strict = true; break; case '--only': only = value().split(',').filter(Boolean); break; case '--skip': skip = value().split(',').filter(Boolean); break; case '--ignore-file': ignore = value(); break; case '--out': out = value(); break; case '--explain': explain = value(); break; case '-h': case '--help': throw new UsageError(USAGE, 0); default: if (a.startsWith('-')) throw new UsageError(`Unknown option: ${a}`); if (target) throw new UsageError('Only one target directory is accepted.'); target = a; } }
  if (!target && !explain) throw new UsageError(USAGE); return { target, profile, format, strict, only, skip, ...(ignore ? { ignore } : {}), ...(out ? { out } : {}), ...(explain ? { explain } : {}) }; }
class UsageError extends Error { constructor(message: string, readonly code = 64) { super(message); } }

export function run(argv: string[]): number {
  let args: Args;
  try { args = parse(argv); } catch (e) { if (e instanceof UsageError) { if (e.code !== 0) console.error(`skill-preflight: ${e.message}\n${USAGE}`); else console.log(e.message); return e.code; } console.error('skill-preflight: invalid arguments'); return 64; }
  if (args.explain) {
    const rule = ALL_RULES.find(r => r.meta.id === args.explain);
    if (!rule) { console.error(`Unknown rule ${args.explain}`); return 64; }
    const profiles = ['default', 'strict', ...(isAgensiRule(rule.meta.id) ? ['agensi'] : [])].join(', ');
    console.log(`${rule.meta.id} ${rule.meta.summary}\nWhy: ${rule.meta.rationale}\nBad: ${rule.meta.badExample}\nGood: ${rule.meta.goodExample}\nProfiles: ${profiles}`);
    return 0;
  }
  try {
    const ctx = loadContext(args.target, args.profile);
    const rules = selectRules(args.profile).filter(r => (!args.only.length || args.only.includes(r.meta.id)) && !args.skip.includes(r.meta.id));
    let findings: Finding[] = rules.flatMap(r => r.check(ctx));
    if (args.ignore) {
      const raw = JSON.parse(fs.readFileSync(args.ignore, 'utf8')) as unknown;
      if (!Array.isArray(raw)) throw new Error('Ignore file must be a JSON array.');
      for (const x of raw) {
        if (!x || typeof x !== 'object') throw new Error('Ignore entries must be objects.');
        const i = x as Record<string, unknown>;
        if (typeof i.reason !== 'string' || !i.reason.trim()) findings.push({ id: 'CLI-001', severity: 'error', category: 'suppression', message: 'Ignore entry has no written reason.', location: { file: args.ignore, line: 1 }, suggestion: 'Add a non-empty reason or remove this suppression.' });
        else findings = findings.filter(f => !(f.id === i.id && f.location.file === i.file));
      }
    }
    const report = buildReport(ctx, findings);
    const output = renderReport(report, args.format);
    if (args.out) fs.writeFileSync(args.out, output); else process.stdout.write(output);
    if (report.summary.errors) return 2;
    if ((args.strict || args.profile === 'strict') && report.summary.warnings) return 1;
    return 0;
  } catch (e) { console.error(`skill-preflight: ${e instanceof Error ? e.message : 'internal error'}`); return 70; }
}

if (isEntry(import.meta.url)) process.exitCode = run(process.argv.slice(2));
