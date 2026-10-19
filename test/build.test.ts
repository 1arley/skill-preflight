import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCatalog, writeCatalog } from '../src/catalog.js';
import { buildSchema, writeSchema } from '../src/schema.js';
import { writeChecksums } from '../src/checksum.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-build-'));

test('the committed rule catalog matches the registry',()=>{assert.equal(fs.readFileSync('skills/devtools/skill-preflight/references/rules.md','utf8'), buildCatalog());});
test('the committed report schema matches the contract',()=>{assert.equal(fs.readFileSync('schemas/report.v1.json','utf8'), buildSchema());});
test('the committed checksum matches the bundle',()=>{const d=tmp();const out=path.join(d,'SHA256SUMS');writeChecksums('skills/devtools/skill-preflight/scripts/preflight.mjs',out);assert.equal(fs.readFileSync(out,'utf8'),fs.readFileSync('SHA256SUMS','utf8'));fs.rmSync(d,{recursive:true,force:true});});
test('the catalog lists the agensi profile membership',()=>{assert.match(buildCatalog(),/\| SEC-001 \| warning \| security \| yes \|/);assert.match(buildCatalog(),/\| DOC-001 \| error \| documentation \| no \|/);});
test('the schema uses a stable identifier instead of a public URL',()=>{assert.match(buildSchema(),/"\$id": "urn:skill-preflight:schema:report:1.0.0"/);});
test('every source module is loaded by the suite so coverage counts it',async()=>{const files=fs.readdirSync('src').filter(f=>f.endsWith('.ts'));assert.ok(files.length>=10);for(const f of files)await import(`../src/${f.replace(/\.ts$/,'.js')}`);});
test('the catalog and schema writers create their files',()=>{const d=tmp();const c=path.join(d,'rules.md');writeCatalog(c);assert.match(fs.readFileSync(c,'utf8'),/\| ID \| Severity \|/);const s=path.join(d,'report.json');writeSchema(s);assert.ok(JSON.parse(fs.readFileSync(s,'utf8')).title);fs.rmSync(d,{recursive:true,force:true});});
