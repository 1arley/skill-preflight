import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { parseFrontmatter } from '../src/context.js';
import { FindingSchema, ReportSchema } from '../src/types.js';

test('frontmatter parser never throws on arbitrary text',()=>{fc.assert(fc.property(fc.string({maxLength:5000}),s=>{assert.doesNotThrow(()=>parseFrontmatter(s));}));});
test('custom YAML tags are never executed',()=>{const p=parseFrontmatter('---\nname: !!js/function >\n  function () { throw 1 }\n---\nbody');assert.notEqual(typeof p.frontmatter.name,'function');});
test('report schema accepts generated report shape and rejects malformed findings',()=>{const base={schemaVersion:'1.0.0',tool:{name:'skill-preflight',version:'0.1.0'},target:'x',profile:'default',generatedAt:new Date().toISOString(),summary:{errors:0,warnings:1,infos:0},findings:[{id:'SEC-001',severity:'warning',category:'security',message:'network',location:{file:'a.js',line:1},suggestion:'remove'}]};assert.ok(ReportSchema.safeParse(base).success);assert.equal(FindingSchema.safeParse({...base.findings[0],location:{file:'a',line:0}}).success,false);});
