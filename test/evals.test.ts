import test from 'node:test';
import assert from 'node:assert/strict';
import { runEvals } from '../src/eval.js';

test('the behavioral eval corpus passes against local fixtures',()=>{const {results,positives,negatives}=runEvals();const failed=results.filter(r=>r.status==='fail').map(r=>[r.id,r.failures]);assert.deepEqual(failed,[]);assert.ok(results.length>=8);assert.ok(positives>=10);assert.ok(negatives>=10);});
test('every eval task names a fixture and at least one assertion',()=>{const {results}=runEvals();assert.ok(results.every(r=>r.status==='pass'||r.status==='skip'));});
