import fs from 'node:fs';
import { isEntry } from './entry.js';
import { ALL_RULES, isAgensiRule } from './rules.js';

export const buildCatalog = (): string => `# Rule catalog

Generated from the rule registry. Run \`npm run catalog\` after rule metadata changes.

| ID | Severity | Category | Agensi profile | Summary |
|---|---|---|---|---|
${ALL_RULES.map(r=>`| ${r.meta.id} | ${r.meta.severity} | ${r.meta.category} | ${isAgensiRule(r.meta.id)?'yes':'no'} | ${r.meta.summary.replaceAll('|','\\|')} |`).join('\n')}
`;

export const writeCatalog = (outPath: string): string => { const doc = buildCatalog(); fs.writeFileSync(outPath, doc); return doc; };

if (isEntry(import.meta.url)) { fs.mkdirSync('skills/devtools/skill-preflight/references',{recursive:true}); writeCatalog('skills/devtools/skill-preflight/references/rules.md'); }
