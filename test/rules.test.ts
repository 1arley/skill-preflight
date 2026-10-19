import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { loadContext } from '../src/context.js';
import { ALL_RULES, isAgensiRule, selectRules } from '../src/rules.js';

const root = path.resolve('test/fixtures');
const ids = (rules: typeof ALL_RULES) => rules.map(r => r.meta.id);

test('all rules have stable IDs, rationale, examples, and a category',()=>{assert.ok(ALL_RULES.length>=30);for(const r of ALL_RULES){assert.match(r.meta.id,/^[A-Z]+-\d{3}$/);assert.ok(r.meta.rationale);assert.ok(r.meta.goodExample);assert.ok(r.meta.badExample);assert.ok(r.meta.category);}});

test('network fixture reports SEC-001 at the exact script line',()=>{const c=loadContext(path.join(root,'bad/network'),'default');const hits=ALL_RULES.flatMap(r=>r.check(c)).filter(f=>f.id==='SEC-001');assert.deepEqual(hits.map(x=>[x.location.file,x.location.line]),[['scripts/run.mjs',1]]);});

test('portable sample fixture has no direct frontmatter or structure issues',()=>{const c=loadContext(path.join(root,'good/sample-skill'),'default');const hits=ALL_RULES.flatMap(r=>r.check(c)).filter(f=>['FM-001','FM-002','FM-003','FM-004','ST-002','ST-003'].includes(f.id));assert.deepEqual(hits,[]);});

test('portable sample fixture produces no findings at all',()=>{const c=loadContext(path.join(root,'good/sample-skill'),'default');assert.deepEqual(ALL_RULES.flatMap(r=>r.check(c)),[]);});

test('agensi profile selects a distinct non-empty subset of the rules',()=>{const agensi=selectRules('agensi');assert.ok(agensi.length>0);assert.ok(agensi.length<ALL_RULES.length);const rest=ALL_RULES.filter(r=>!isAgensiRule(r.meta.id)).map(r=>r.meta.id);assert.ok(rest.length>0);for(const id of ids(agensi))assert.ok(isAgensiRule(id));assert.ok(!ids(agensi).includes('DOC-001'));assert.ok(!ids(agensi).includes('EVAL-001'));assert.ok(ids(agensi).includes('SEC-001'));assert.ok(ids(agensi).includes('SEC-008'));});

test('default and strict profiles run every rule',()=>{assert.deepEqual(ids(selectRules('default')),ids(ALL_RULES));assert.deepEqual(ids(selectRules('strict')),ids(ALL_RULES));});

test('agensi profile reports security findings and drops documentation findings',()=>{const c=loadContext(path.join(root,'bad/network'),'agensi');const hits=selectRules('agensi').flatMap(r=>r.check(c));assert.ok(hits.some(f=>f.id==='SEC-001'));assert.ok(!hits.some(f=>f.id.startsWith('DOC-')));const full=ALL_RULES.flatMap(r=>r.check(loadContext(path.join(root,'bad/network'),'default')));assert.ok(full.some(f=>f.id.startsWith('DOC-')));});

test('frontmatter findings point at the line that holds the field',()=>{const c=loadContext(path.join(root,'bad/name-mismatch'),'default');const hit=ALL_RULES.flatMap(r=>r.check(c)).find(f=>f.id==='FM-002');assert.ok(hit);assert.deepEqual([hit.location.file,hit.location.line],['SKILL.md',2]);});

test('SEC-007 ignores prose that merely describes obfuscation',()=>{const c=loadContext(path.join(root,'good/sample-skill'),'default');assert.deepEqual(ALL_RULES.flatMap(r=>r.check(c)).filter(f=>f.id==='SEC-007'),[]);});
