import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { isEntry } from './entry.js';
import { ReportSchema } from './types.js';

export const buildSchema = (): string => { const schema = z.toJSONSchema(ReportSchema, {target:'draft-2020-12'}); schema.$id = 'urn:skill-preflight:schema:report:1.0.0'; schema.title = 'skill-preflight report v1'; return `${JSON.stringify(schema,null,2)}\n`; };

export const writeSchema = (outPath: string): string => { const doc = buildSchema(); fs.mkdirSync(path.dirname(outPath), {recursive:true}); fs.writeFileSync(outPath, doc); return doc; };

if (isEntry(import.meta.url)) writeSchema('schemas/report.v1.json');
