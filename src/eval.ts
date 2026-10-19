import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadContext } from './context.js';
import { isEntry } from './entry.js';
import { selectRules } from './rules.js';
import { buildReport, renderReport } from './report.js';

export type EvalAssertion = { contains?: string[]; notContains?: string[] };
export type EvalTask = { id: string; input: string; fixture: string; profile?: 'default'|'strict'|'agensi'; format?: 'text'|'json'|'sarif'|'md'; setup?: 'symlink-outside'; assertions: EvalAssertion[] };
export type EvalResult = { id: string; status: 'pass'|'fail'|'skip'; failures: string[] };

const CORPUS = 'skills/devtools/skill-preflight/evals/evals.json';
const TRIGGERS = 'skills/devtools/skill-preflight/evals/trigger.json';
const FIXTURES = 'test/fixtures';

/**
 * Runs the behavioral eval corpus against local fixtures. Trigger positives and negatives are
 * validated for shape only: deciding whether a description activates needs a model, so the
 * deterministic script cannot execute them.
 */
export function runEvals(root: string = process.cwd()): { results: EvalResult[]; positives: number; negatives: number } {
  const corpus = JSON.parse(fs.readFileSync(path.join(root, CORPUS), 'utf8')) as { version?: number; tasks: EvalTask[] };
  if (!Array.isArray(corpus.tasks) || corpus.tasks.length < 8) throw new Error('At least eight eval tasks are required.');
  for (const t of corpus.tasks) if (!t.id || !t.input || !t.fixture || !Array.isArray(t.assertions) || !t.assertions.length) throw new Error(`Invalid eval task: ${t.id}`);
  const trigger = JSON.parse(fs.readFileSync(path.join(root, TRIGGERS), 'utf8')) as { shouldTrigger: string[]; shouldNotTrigger: string[] };
  if (trigger.shouldTrigger.length < 10 || trigger.shouldNotTrigger.length < 10) throw new Error('Trigger corpus requires ten positives and ten negatives.');
  return { results: corpus.tasks.map(t => runTask(t, root)), positives: trigger.shouldTrigger.length, negatives: trigger.shouldNotTrigger.length };
}

function runTask(task: EvalTask, root: string): EvalResult {
  const source = path.join(root, FIXTURES, task.fixture);
  let dir = source, temp: string | undefined;
  try {
    if (task.setup === 'symlink-outside') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-eval-'));
      dir = path.join(temp, path.basename(source));
      fs.cpSync(source, dir, { recursive: true });
      try { fs.symlinkSync(os.tmpdir(), path.join(dir, 'outside'), 'dir'); }
      catch (e) { return { id: task.id, status: 'skip', failures: [`symlink setup unavailable: ${e instanceof Error ? e.message : 'unknown error'}`] }; }
    }
    const profile = task.profile ?? 'default';
    const ctx = loadContext(dir, profile);
    const findings = selectRules(profile).flatMap(r => r.check(ctx));
    const output = renderReport(buildReport(ctx, findings), task.format ?? 'text');
    const failures: string[] = [];
    for (const a of task.assertions) {
      for (const s of a.contains ?? []) if (!output.includes(s)) failures.push(`missing "${s}"`);
      for (const s of a.notContains ?? []) if (output.includes(s)) failures.push(`unexpected "${s}"`);
    }
    return { id: task.id, status: failures.length ? 'fail' : 'pass', failures };
  } finally { if (temp) fs.rmSync(temp, { recursive: true, force: true }); }
}

if (isEntry(import.meta.url)) {
  const { results, positives, negatives } = runEvals();
  for (const r of results) console.log(`${r.status.toUpperCase().padEnd(4)} ${r.id}${r.failures.length ? ` — ${r.failures.join('; ')}` : ''}`);
  const failed = results.filter(r => r.status === 'fail').length;
  console.log(`${results.length - failed}/${results.length} eval tasks passed. Trigger corpus: ${positives} positives, ${negatives} negatives.`);
  process.exitCode = failed ? 1 : 0;
}
