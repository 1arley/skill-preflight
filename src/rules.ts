import type { Context, Finding, Rule, RuleMeta } from './types.js';
import { finding } from './types.js';

const meta = (id: string, category: string, summary: string, rationale: string, badExample: string, goodExample: string, severity: RuleMeta['severity'] = 'warning'): RuleMeta => ({ id, category, summary, rationale, badExample, goodExample, severity });
const rules: Rule[] = [];
function add(m: RuleMeta, check: (ctx: Context) => Finding[]) { rules.push({ meta: m, check }); }
const lineOf = (s: string, offset: number) => s.slice(0, offset).split('\n').length;
const scan = (ctx: Context, m: RuleMeta, re: RegExp, msg: string, files = ctx.files.filter(f => f.content !== undefined && !f.path.endsWith('.lock'))): Finding[] => files.flatMap(file => {
  const out: Finding[] = []; let match: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((match = re.exec(file.content!))) { out.push(finding(m, file.path, lineOf(file.content!, match.index), msg)); if (!re.global) break; if (match[0].length === 0) re.lastIndex++; }
  return out;
});
const fmLoc = (ctx: Context, key: string) => {
  const block = ctx.skill.content?.split(/^---\s*$/m)[1] ?? '';
  return Math.max(1, (block.split('\n').findIndex(l => new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`).test(l)) + 1));
};

const FM001 = meta('FM-001','frontmatter','Frontmatter is valid YAML mapping','Parsers can disagree on malformed YAML and duplicate keys.','name: one\nname: two','name: skill-name', 'error');
add(FM001, c => c.frontmatterError ? [finding(FM001,'SKILL.md',1,c.frontmatterError)] : []);
const FM002 = meta('FM-002','frontmatter','Name matches the folder and portable syntax','Stable portable identifiers prevent discovery failures.','name: Skill_Name','name: skill-name','error');
add(FM002,c => { const n=c.frontmatter.name; return typeof n==='string' && /^[a-z0-9-]+$/.test(n) && n===c.folder ? [] : [finding(FM002,'SKILL.md',fmLoc(c,'name'),`name must be lowercase letters, digits, or hyphens and equal folder “${c.folder}”.`)]; });
const FM003 = meta('FM-003','frontmatter','Description is present and 1–3 sentences','Descriptions drive activation and should state capability plus trigger conditions.','description: A useful skill.','description: Audits skill folders deterministically. Use when the user asks to audit a skill or check a SKILL.md.','error');
add(FM003,c => { const d=c.frontmatter.description; if(typeof d!=='string'||!d.trim()) return [finding(FM003,'SKILL.md',fmLoc(c,'description'),'Description is required and must be text.')]; const count=(d.match(/[.!?](?:\s|$)/g)||[]).length || 1; return count<=3?[]:[finding(FM003,'SKILL.md',fmLoc(c,'description'),`Description has ${count} sentences; keep it to one through three.`)]; });
const FM004 = meta('FM-004','frontmatter','Description explains what and when','Concrete trigger phrases improve skill activation precision.','description: A helpful tool.','description: Audits skills. Use when asked to audit this skill.');
add(FM004,c => { const d=typeof c.frontmatter.description==='string'?c.frontmatter.description.toLowerCase():''; return /\b(use when|when to|when the user|when asked|use this when)\b/.test(d)&&/(audit|check|lint|publish|skill|skill\.md)/.test(d)?[]:[finding(FM004,'SKILL.md',fmLoc(c,'description'),'Description should say what the skill does and include an explicit use-when trigger.')]; });
const FM005 = meta('FM-005','frontmatter','Optional portable fields use valid types','Invalid types are ignored or interpreted differently by hosts.','when_to_use: true','when_to_use: Use when auditing a skill.');
add(FM005,c => { const o=c.frontmatter; const bad=(k:string,ok:boolean)=>!Object.hasOwn(o,k)||ok?[]:[finding(FM005,'SKILL.md',fmLoc(c,k),`${k} has an invalid type.`)]; return [...bad('when_to_use',typeof o.when_to_use==='string'),...bad('allowed-tools',Array.isArray(o['allowed-tools'])&&o['allowed-tools'].every(x=>typeof x==='string')),...bad('disable-model-invocation',typeof o['disable-model-invocation']==='boolean')]; });
const FM006 = meta('FM-006','frontmatter','Unknown frontmatter fields are informational','Unknown keys may be agent-specific rather than invalid.','mystery: true','name and description only','info');
add(FM006,c => { const known=new Set(['name','description','when_to_use','allowed-tools','disable-model-invocation','context','hooks','model','effort','argument-hint','arguments','license','compatibility','metadata']); return Object.keys(c.frontmatter).filter(k=>!known.has(k)).map(k=>finding(FM006,'SKILL.md',fmLoc(c,k),`Unknown field “${k}”; verify host support.`)); });
const FM007 = meta('FM-007','frontmatter','Agent-specific fields are marked for portability','Optional fields have uneven support across agent hosts.','context: fork','when_to_use: Use when...','info');
add(FM007,c => Object.keys(c.frontmatter).filter(k=>['context','hooks','model','effort'].includes(k)).map(k=>finding(FM007,'SKILL.md',fmLoc(c,k),`“${k}” is not portable across all skill hosts.`)));

const ST001=meta('ST-001','structure','SKILL.md stays under 500 lines','Short entrypoints keep the core workflow easy to load.','501-line SKILL.md','Move detail into references.');
add(ST001,c => { const n=(c.skill.content??'').split('\n').length; return n>500?[finding(ST001,'SKILL.md',501,`SKILL.md has ${n} lines; move detailed guidance to references.`)]:[]; });
const ST002=meta('ST-002','structure','Referenced local files exist','Missing references leave agents without required instructions.','[Policy](references/missing.md)','[Policy](references/security.md)');
add(ST002,c => { const out:Finding[]=[]; for(const f of c.files){if(!f.content)continue; const re=/\[[^\]]*\]\(([^)]+)\)|(?:read|open|see|follow)\s+[`'"(]?((?:references|scripts|assets)\/[\w./-]+)/gi; let m:RegExpExecArray|null; while((m=re.exec(f.content))){const target=(m[1]??m[2]??'').split('#')[0]!.split('?')[0]!; if(!target||/^(?:https?:|mailto:|#)/i.test(target))continue; const base=pathDir(f.path), resolved=normalizeLocal(base,target); if(resolved && !c.byPath.has(resolved))out.push(finding(ST002,f.path,lineOf(f.content,m.index),`Referenced local file “${target}” does not exist.`));}} return out; });
const ST003=meta('ST-003','structure','Relative links resolve inside the skill','Broken or escaping links reduce usability and can reveal unexpected paths.','[x](../../outside)','[x](references/x.md)');
add(ST003,c=>{const out:Finding[]=[];for(const f of c.files){if(!f.content)continue;const re=/\[[^\]]*\]\(([^)]+)\)/g;let m:RegExpExecArray|null;while((m=re.exec(f.content))){const u=m[1]!;if(/^(https?:|mailto:|#)/i.test(u))continue;const p=normalizeLocal(pathDir(f.path),u.split('#')[0]!.split('?')[0]!);if(!p||(!c.byPath.has(p)&&!c.byPath.has(p+'/')))out.push(finding(ST003,f.path,lineOf(f.content,m.index),`Relative link “${u}” is broken or escapes the skill root.`));}}return out;});
const ST004=meta('ST-004','structure','Large references have an index','An index makes long supporting material discoverable.','references/a.md with 301 lines and no index','references/README.md');
add(ST004,c=>{const large=c.files.filter(f=>f.path.startsWith('references/')&&f.content&&f.content.split('\n').length>300);return large.length&&!c.files.some(f=>/^references\/(README|index)\.md$/i.test(f.path))?[finding(ST004,large[0]!.path,301,'A reference exceeds 300 lines; add references/README.md or index.md.')]:[];});
const ST005=meta('ST-005','structure','Scripts have executable permission','Executable scripts should work from the documented command line on Unix.','scripts/run.sh mode 0644','chmod +x scripts/run.sh');
add(ST005,c=>c.files.filter(f=>/^scripts\/.*\.(?:sh|mjs|cjs|js|py)$/.test(f.path)&&!f.symlink&&(f.mode&0o111)===0).map(f=>finding(ST005,f.path,1,'Script file has no executable bit.')));
const ST006=meta('ST-006','structure','Unexpected binary files are reviewed','Skills are instructions; opaque binaries are difficult to inspect.','unexplained payload.bin','remove binary or document an expected asset');
add(ST006,c=>c.files.filter(f=>f.binary&&!/^(?:assets\/|\.gitignore$)/.test(f.path)).map(f=>finding(ST006,f.path,1,`Binary or unreadable file (${f.bytes} bytes).`)));
const ST007=meta('ST-007','structure','Symlinks stay within the target root','A link can expose host files or make audit results depend on external data.','references/key -> ~/.ssh/id_rsa','ship a regular file inside the skill');
add(ST007,c=>c.files.filter(f=>f.symlink).map(f=>finding(ST007,f.path,1,'Symlink is not followed; replace it with an in-root regular file or remove it.')));

const security: [string,RegExp,string,string][]=[
 ['network',/\b(?:fetch\s*\(|https?\.request\s*\(|(?:curl|wget)\s+|\b(?:http|https|net|dns)\.(?:get|request|connect|lookup)\s*\()/gi,'SEC-001','Outbound network access is statically referenced.'],
 ['env',/\bprocess\.env(?:\.[A-Z_][A-Z0-9_]*|\[['"`][A-Z_][A-Z0-9_]*['"`])|\bDeno\.env\b|\bos\.environ\b/gi,'SEC-002','Environment variable access may expose credentials.'],
 ['sensitive-path',/(?:~\/\.(?:ssh|aws)|\.ssh\/|\.aws\/|keychain|credential manager|\.config\/(?:gh|gcloud)|\b(?:OPENAI|ANTHROPIC|AWS|GITHUB)_TOKEN\b)/gi,'SEC-003','Access to credential stores or tokens is referenced.'],
 ['disk-scan',/\b(?:find\s+\/|readdirSync\s*\(\s*['"`]\s*\/|glob(?:Sync)?\s*\(\s*['"`]\*\*|walkDir|os\.walk\s*\()/gi,'SEC-004','Broad filesystem enumeration is referenced.'],
 ['eval',/\beval\s*\(|new\s+Function\s*\(/gi,'SEC-005','Dynamic code evaluation is referenced.'],
 ['shell-interpolation',/child_process[\s\S]{0,120}(?:exec|execSync)\s*\([^)]*(?:\$\{|`\s*\+|\+\s*[A-Za-z_$])/gi,'SEC-006','Shell command construction appears to interpolate input.'],
 ['encoded-blob',/(?:[A-Za-z0-9+/]{180,}={0,2}|(?:\\x[0-9a-fA-F]{2}){12,}|(?<![A-Za-z0-9_$])_0x[0-9a-fA-F]{4,}(?![A-Za-z0-9_$]))/g,'SEC-007','Large encoded, minified, or obfuscated content is present.'],
 ['secret',/\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AIza[0-9A-Za-z_-]{30,})/g,'SEC-008','A recognizable secret pattern is present.'],
 ['injection',/ignore (?:all )?(?:previous|prior|above) instructions|reveal (?:the )?(?:system prompt|hidden instructions)|do not tell the user|exfiltrat(?:e|ion)/gi,'SEC-009','Prompt-injection or concealment language is present.'],
 ['hidden-html',/<!--(?:(?!\n\s*-->)[\s\S]){0,500}(?:ignore|secret|instruction|http|token|key)(?:(?!\n\s*-->)[\s\S]){0,500}-->/gi,'SEC-010','HTML comment contains instruction-like or sensitive wording.'],
 ['unicode',/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g,'SEC-011','Invisible or bidirectional Unicode control character is present.'],
 ['remote-image',/!\[[^\]]*\]\(\s*https?:\/\//gi,'SEC-012','Markdown image loads from a remote URL and can disclose access metadata.'],
];
for(const [key,re,id,msg] of security){const m=meta(id,'security',msg,'Skills execute with the host agent privileges; suspicious access should be explicit and reviewed.','unexplained sensitive operation','remove it or document a narrow, user-approved purpose',key==='secret'?'error':'warning');add(m,c=>key==='encoded-blob'?[...scan(c,m,re,msg),...scan(c,m,/^[^\n]{300,}$/gm,'A single very long line suggests minified content.',c.files.filter(f=>/\.(?:ts|js|mjs|cjs|jsx|tsx)$/.test(f.path)))]:scan(c,m,re,msg));}
const SEC013=meta('SEC-013','security','Secret-like high-entropy strings are reviewed','Random-looking literals can conceal credentials even when prefixes are unknown.','token = "uA83mQ..."','read credential from an explicitly documented secret source');
add(SEC013,c=>scan(c,SEC013,/(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{32,}(?![A-Za-z0-9+/])/g,'High-entropy-looking literal; verify it is not a secret.',c.files.filter(f=>f.content&&/.(?:ts|js|mjs|sh|py|md)$/.test(f.path))));

const SUP001=meta('SUP-001','supply-chain','Package lifecycle scripts are absent','Install hooks execute code during dependency installation.','"postinstall":"node setup.js"','remove lifecycle hooks or explain and isolate');
add(SUP001,c=>{const p=c.packageData;const s=p?.scripts;if(!s||typeof s!=='object')return[];return Object.keys(s as object).filter(k=>/^(preinstall|install|postinstall|prepare)$/.test(k)).map(k=>finding(SUP001,'package.json',1,`Lifecycle script “${k}” executes during install.`));});
const SUP002=meta('SUP-002','supply-chain','Dependencies use exact versions','Ranges can change the dependency graph without a source change.','"pkg":"^1.2.3"','"pkg":"1.2.3"');
add(SUP002,c=>{const p=c.packageData;const out:Finding[]=[];for(const section of ['dependencies','devDependencies','optionalDependencies','peerDependencies']){const d=p?.[section];if(d&&typeof d==='object')for(const [k,v] of Object.entries(d))if(typeof v!=='string'||!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(v))out.push(finding(SUP002,'package.json',1,`${section}.${k} does not use an exact semantic version.`));}return out;});
const SUP003=meta('SUP-003','supply-chain','Package lockfile is present','A lockfile makes dependency resolution reproducible.','package.json without lockfile','commit the package manager lockfile');
add(SUP003,c=>c.packageData&&!c.lockfiles.length?[finding(SUP003,'package.json',1,'package.json exists without a recognized lockfile.')]:[]);
const SUP004=meta('SUP-004','supply-chain','Dependencies use an approved public registry','Unexpected registries can redirect package downloads.','"resolved":"https://unknown.example/pkg.tgz"','https://registry.npmjs.org/');
add(SUP004,c=>{const out:Finding[]=[];for(const f of c.files.filter(f=>/^(?:package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(f.path)&&f.content)){const re=/https?:\/\/([^/\s"']+)/g;let m:RegExpExecArray|null;while((m=re.exec(f.content!)))if(!['registry.npmjs.org','registry.yarnpkg.com'].includes(m[1]!))out.push(finding(SUP004,f.path,lineOf(f.content!,m.index),`Dependency registry “${m[1]}” is outside the default public allowlist.`));}return out;});
const SUP005=meta('SUP-005','supply-chain','Documentation recommends safe installation','Ignoring install scripts reduces execution during dependency installation.','npm install','npm ci --ignore-scripts');
add(SUP005,c=>c.packageData&&c.files.some(f=>f.path==='README.md'&&f.content)&&!c.files.find(f=>f.path==='README.md')!.content!.includes('npm ci --ignore-scripts')?[finding(SUP005,'README.md',1,'Document `npm ci --ignore-scripts` for installing development dependencies.')]:[]);

const DOC001=meta('DOC-001','documentation','License file is present','A license clarifies reuse and distribution rights.','missing LICENSE','include a license compatible with the skill contents','error');
add(DOC001,c=>c.files.some(f=>/^LICENSE(?:\.|$)/i.test(f.path))?[]:[finding(DOC001,'SKILL.md',1,'No LICENSE file is present.')]);
const DOC002=meta('DOC-002','documentation','README documents installation, privacy, and removal','Installers need clear setup and an easy way to stop using the skill.','README without privacy/removal instructions','document install, privacy, and uninstall');
add(DOC002,c=>{const f=c.files.find(f=>/^README\.md$/i.test(f.path));if(!f?.content)return[ finding(DOC002,'README.md',1,'README.md is missing.') ];const s=f.content.toLowerCase();return ['install','privacy','remove'].filter(x=>!s.includes(x)).map(x=>finding(DOC002,f.path,1,`README should document ${x}.`));});
const DOC003=meta('DOC-003','documentation','Changelog is present','A changelog makes published changes reviewable.','missing changelog','add CHANGELOG.md');
add(DOC003,c=>c.files.some(f=>/^CHANGELOG\.md$/i.test(f.path))?[]:[finding(DOC003,'SKILL.md',1,'CHANGELOG.md is missing.')]);
const DOC004=meta('DOC-004','documentation','Security guidance is present','Users need explicit trust boundaries and disclosure contact.','missing SECURITY.md or security section','document the security policy','error');
add(DOC004,c=>{const sec=c.files.some(f=>/^SECURITY\.md$/i.test(f.path))||c.files.some(f=>/^references\/security\.md$/i.test(f.path));const readme=c.files.find(f=>f.path==='README.md')?.content??'';return sec&&/security/i.test(readme)?[]:[finding(DOC004,'README.md',1,'Add SECURITY.md or references/security.md and link security information from README.')];});
const DOC005=meta('DOC-005','documentation','Declared derivative preserves attribution','Derivative skills need clear source and license attribution.','claims derived from X without source','name source and retain its required notices');
add(DOC005,c=>{const s=[...c.files].filter(f=>f.content).map(f=>f.content!).join('\n');return /derived from|based on|adapted from/i.test(s)&&!/attribution|license|copyright/i.test(s)?[finding(DOC005,'README.md',1,'A derivative is claimed but source/license attribution is not apparent.')]:[];});

const EVAL001=meta('EVAL-001','evaluation','Executable eval task corpus exists','Behavioral tasks make quality claims checkable.','missing evals/evals.json','add at least eight tasks with assertions','error');
add(EVAL001,c=>{const f=c.byPath.get('evals/evals.json');if(!f?.content)return[finding(EVAL001,'SKILL.md',1,'evals/evals.json is missing.')];try{const x=JSON.parse(f.content) as {tasks?:unknown[]};return Array.isArray(x.tasks)&&x.tasks.length>=8?[]:[finding(EVAL001,f.path,1,'Expected at least eight eval tasks.')];}catch{return[finding(EVAL001,f.path,1,'evals/evals.json is not valid JSON.')];}});
const EVAL002=meta('EVAL-002','evaluation','Trigger corpus has positive and negative queries','Negative examples reduce accidental activation.','only positive trigger examples','include at least 10 positive and 10 near-miss negatives','error');
add(EVAL002,c=>{const f=c.byPath.get('evals/trigger.json');if(!f?.content)return[finding(EVAL002,'SKILL.md',1,'evals/trigger.json is missing.')];try{const x=JSON.parse(f.content) as {shouldTrigger?:unknown[];shouldNotTrigger?:unknown[]};return Array.isArray(x.shouldTrigger)&&x.shouldTrigger.length>=10&&Array.isArray(x.shouldNotTrigger)&&x.shouldNotTrigger.length>=10?[]:[finding(EVAL002,f.path,1,'Need at least ten shouldTrigger and ten shouldNotTrigger queries.')];}catch{return[finding(EVAL002,f.path,1,'evals/trigger.json is not valid JSON.')];}});
const PORT001=meta('PORT-001','portability','Claude Code-only fields are identified','Other agents may ignore these fields without warning.','context: fork with no portability note','document host-specific behavior and provide a portable workflow','info');
add(PORT001,c=>{const s=c.skill.content??'';return Object.keys(c.frontmatter).some(k=>['context','hooks'].includes(k))&&!/claude code|host-specific|portability/i.test(s)?[finding(PORT001,'SKILL.md',1,'Claude Code-only frontmatter appears without a portability note.')]:[];});

export const ALL_RULES = rules;
/**
 * Rule IDs the `agensi` profile selects. The set mirrors Agensi's public security categories
 * (file structure, file types, dangerous commands, secrets, environment-variable harvesting,
 * network access, obfuscation, prompt-injection screening). It is a local heuristic and does not
 * reproduce their private scanner or predict a marketplace decision.
 */
const AGENSI_RULE_IDS = new Set(['FM-001','ST-002','ST-003','ST-005','ST-006','ST-007','SEC-001','SEC-002','SEC-003','SEC-004','SEC-005','SEC-006','SEC-007','SEC-008','SEC-009','SEC-010','SEC-011','SEC-012','SEC-013','SUP-001','SUP-004']);
export const isAgensiRule = (id: string): boolean => AGENSI_RULE_IDS.has(id);
export const selectRules = (profile: Context['profile']): Rule[] => profile === 'agensi' ? rules.filter(r => AGENSI_RULE_IDS.has(r.meta.id)) : rules;
function pathDir(p:string){const i=p.lastIndexOf('/');return i<0?'':p.slice(0,i);}
function normalizeLocal(base:string,target:string):string|undefined { const value=[base,target].filter(Boolean).join('/').replace(/\\/g,'/');const parts:string[]=[];for(const p of value.split('/')){if(!p||p==='.')continue;if(p==='..'){if(!parts.length)return;parts.pop();}else parts.push(p);}return parts.join('/'); }
