import fs from 'node:fs';
import crypto from 'node:crypto';
import { isEntry } from './entry.js';

export const writeChecksums = (file: string, outPath: string): string => { const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); const doc = `${hash}  ${file}\n`; fs.writeFileSync(outPath, doc); return doc; };

if (isEntry(import.meta.url)) writeChecksums('skills/devtools/skill-preflight/scripts/preflight.mjs','SHA256SUMS');
