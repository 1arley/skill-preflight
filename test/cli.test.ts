import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { run } from '../src/cli.js';

const cli = path.resolve('scripts/preflight.mjs');
const spawn = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

function capture(fn: () => number): { code: number; out: string; err: string } {
  const out: string[] = [], err: string[] = [];
  const write = process.stdout.write, error = process.stderr.write, log = console.log, errorLog = console.error;
  process.stdout.write = ((chunk: string | Uint8Array) => { out.push(String(chunk)); return true; }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => { err.push(String(chunk)); return true; }) as typeof process.stderr.write;
  console.log = (...args: unknown[]) => { out.push(`${args.map(String).join(' ')}\n`); };
  console.error = (...args: unknown[]) => { err.push(`${args.map(String).join(' ')}\n`); };
  try { return { code: fn(), out: out.join(''), err: err.join('') }; }
  finally { process.stdout.write = write; process.stderr.write = error; console.log = log; console.error = errorLog; }
}

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-test-'));

test('invalid options return usage code 64',()=>{const r=capture(()=>run(['--wat']));assert.equal(r.code,64);assert.match(r.err,/Unknown option/);});
test('a missing target returns read error code 70',()=>{const r=capture(()=>run(['test/fixtures/does-not-exist']));assert.equal(r.code,70);assert.match(r.err,/ENOENT|no such file/);});
test('help exits with code 0',()=>{const r=capture(()=>run(['--help']));assert.equal(r.code,0);assert.match(r.out,/Usage:/);});
test('--explain returns rule rationale and examples',()=>{const r=capture(()=>run(['--explain','FM-002']));assert.equal(r.code,0);assert.match(r.out,/Why:/);assert.match(r.out,/Bad:/);assert.match(r.out,/Good:/);});
test('--explain names the profiles a rule belongs to',()=>{assert.match(capture(()=>run(['--explain','SEC-001'])).out,/Profiles: default, strict, agensi/);assert.match(capture(()=>run(['--explain','DOC-001'])).out,/Profiles: default, strict/);});
test('--explain rejects an unknown rule',()=>{assert.equal(capture(()=>run(['--explain','ZZ-999'])).code,64);});
test('JSON, Markdown, and SARIF formats are emitted',()=>{for(const format of ['json','md','sarif']){const r=spawn('test/fixtures/good/sample-skill','--format',format);assert.ok([0,2].includes(r.status??-1));if(format==='json')assert.equal(JSON.parse(r.stdout).schemaVersion,'1.0.0');if(format==='sarif')assert.equal(JSON.parse(r.stdout).version,'2.1.0');if(format==='md')assert.match(r.stdout,/^# Skill preflight report/);}});
test('output file writes only when explicitly requested',()=>{const d=tmp();const out=path.join(d,'report.json');const r=spawn('test/fixtures/good/sample-skill','--format','json','--out',out);assert.ok(fs.existsSync(out));assert.equal(r.stdout,'');fs.rmSync(d,{recursive:true,force:true});});
test('markdown and SARIF rendering carry every finding',()=>{const md=capture(()=>run(['test/fixtures/bad/network','--format','md']));assert.match(md.out,/^- \*\*ERROR DOC-001\*\*/m);const sarif=capture(()=>run(['test/fixtures/bad/network','--format','sarif']));const doc=JSON.parse(sarif.out);const ids=doc.runs[0].tool.driver.rules.map((r:{id:string})=>r.id);assert.ok(doc.runs[0].results.length>0);assert.ok(doc.runs[0].results.every((r:{ruleId:string,level:string})=>ids.includes(r.ruleId)&&['error','warning','note'].includes(r.level)));assert.equal(doc.runs[0].tool.driver.informationUri,'https://github.com/1arley/skill-preflight');});
test('the report reaches stdout and nothing else',()=>{const r=capture(()=>run(['test/fixtures/bad/network','--format','json']));assert.equal(r.code,2);assert.equal(r.err,'');assert.equal(JSON.parse(r.out).summary.errors>0,true);});
test('the report is written to the requested path',()=>{const d=tmp();const out=path.join(d,'report.json');const r=capture(()=>run(['test/fixtures/bad/network','--format','json','--out',out]));assert.equal(r.out,'');assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).target,'network');fs.rmSync(d,{recursive:true,force:true});});
test('--only and --skip filter the rules',()=>{const only=capture(()=>run(['test/fixtures/bad/network','--format','json','--only','SEC-001']));const ids=(JSON.parse(only.out).findings as {id:string}[]).map(f=>f.id);assert.deepEqual([...new Set(ids)],['SEC-001']);const skip=capture(()=>run(['test/fixtures/bad/network','--format','json','--skip','SEC-001']));assert.equal((JSON.parse(skip.out).findings as {id:string}[]).some(f=>f.id==='SEC-001'),false);});
test('strict turns warnings into a failing exit code',()=>{const relaxed=capture(()=>run(['test/fixtures/bad/network','--only','SEC-001']));assert.equal(relaxed.code,0);const strict=capture(()=>run(['test/fixtures/bad/network','--only','SEC-001','--strict']));assert.equal(strict.code,1);});
test('the agensi profile reports a narrower rule set',()=>{const r=capture(()=>run(['test/fixtures/bad/network','--profile','agensi','--format','json']));const ids=(JSON.parse(r.out).findings as {id:string}[]).map(f=>f.id);assert.ok(ids.includes('SEC-001'));assert.equal(ids.some(id=>id.startsWith('DOC-')),false);});
test('an ignore entry suppresses a finding and a missing reason is an error',()=>{const d=tmp();const file=path.join(d,'ignore.json');fs.writeFileSync(file,JSON.stringify([{id:'SEC-001',file:'scripts/run.mjs',reason:'reviewed with the author'}]));const r=capture(()=>run(['test/fixtures/bad/network','--format','json','--ignore-file',file]));assert.equal((JSON.parse(r.out).findings as {id:string}[]).some(f=>f.id==='SEC-001'),false);fs.writeFileSync(file,JSON.stringify([{id:'SEC-001',file:'scripts/run.mjs',reason:''}]));const bad=capture(()=>run(['test/fixtures/bad/network','--format','json','--ignore-file',file]));assert.equal((JSON.parse(bad.out).findings as {id:string}[]).some(f=>f.id==='CLI-001'),true);fs.rmSync(d,{recursive:true,force:true});});
test('a malformed ignore file is a read error',()=>{const d=tmp();const file=path.join(d,'ignore.json');fs.writeFileSync(file,'{"not":"an array"}');assert.equal(capture(()=>run(['test/fixtures/bad/network','--ignore-file',file])).code,70);fs.rmSync(d,{recursive:true,force:true});});
test('runtime bundle does not attempt network access',()=>{const preload=pathToFileURL(path.resolve('test/no-network.mjs')).href;const r=spawnSync(process.execPath,['--import',preload,cli,'test/fixtures/good/sample-skill'],{encoding:'utf8'});assert.equal(/network attempted/.test(r.stderr),false);assert.equal(r.status,0,r.stderr);});
test('external symlink is not followed',(t)=>{const d=tmp();fs.copyFileSync('test/fixtures/good/sample-skill/SKILL.md',path.join(d,'SKILL.md'));try{fs.symlinkSync(os.tmpdir(),path.join(d,'outside'),'dir');}catch(e){fs.rmSync(d,{recursive:true,force:true});t.skip(`symlinks unavailable: ${e instanceof Error?e.message:'unknown'}`);return;}try{const r=spawn(d,'--format','json');assert.ok(JSON.parse(r.stdout).findings.some((f:{id:string})=>f.id==='ST-007'));}finally{fs.rmSync(d,{recursive:true,force:true});}});
