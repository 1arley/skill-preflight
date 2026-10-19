import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import type { Context, FileEntry } from './types.js';

const MAX_FILES = 500, MAX_DEPTH = 12, MAX_FILE = 1_000_000, MAX_TOTAL = 20_000_000;
const BINARY_EXT = /\.(?:png|jpe?g|gif|webp|ico|pdf|zip|gz|tar|wasm|so|dylib|dll|exe|class|pyc|woff2?)$/i;

export function loadContext(input: string, profile: Context['profile']): Context {
  const root = path.resolve(input), stat = fs.lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Target must be a real directory, not a symlink.');
  const files: FileEntry[] = []; let total = 0;
  const visit = (dir: string, depth: number) => {
    if (depth > MAX_DEPTH || files.length >= MAX_FILES) return;
    for (const name of fs.readdirSync(dir).sort()) {
      if (files.length >= MAX_FILES) break;
      const absolute = path.join(dir, name), rel = path.relative(root, absolute).split(path.sep).join('/');
      const info = fs.lstatSync(absolute);
      if (info.isSymbolicLink()) { files.push({ path: rel, absolute, bytes: 0, mode: info.mode, binary: false, symlink: true }); continue; }
      if (info.isDirectory()) { visit(absolute, depth + 1); continue; }
      if (!info.isFile()) continue;
      const bytes = info.size; total += bytes;
      const binary = BINARY_EXT.test(name);
      let content: string | undefined;
      if (!binary && bytes <= MAX_FILE && total <= MAX_TOTAL) {
        const raw = fs.readFileSync(absolute);
        if (raw.includes(0)) { /* preserve binary status without decoding arbitrary bytes */ }
        else content = raw.toString('utf8');
      }
      files.push({ path: rel, absolute, ...(content === undefined ? {} : { content }), bytes, mode: info.mode, binary: binary || content === undefined, symlink: false });
    }
  };
  visit(root, 0);
  const byPath = new Map(files.map(f => [f.path, f]));
  const skill = byPath.get('SKILL.md');
  if (!skill?.content) throw new Error('Target must contain a readable SKILL.md file (maximum 1 MB).');
  const parsed = parseFrontmatter(skill.content), { frontmatter, frontmatterError, body } = parsed;
  const packageData = parseJson(files.find(f => f.path === 'package.json')?.content);
  return { root, folder: path.basename(root), files, byPath, skill, frontmatter, body, ...(frontmatterError ? { frontmatterError } : {}), profile, ...(packageData ? { packageData } : {}), lockfiles: files.filter(f => /^(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(f.path)).map(f => f.path) };
}
export function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string; frontmatterError?: string } {
  try {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) return { frontmatter: {}, body: content, frontmatterError: 'Missing YAML frontmatter delimited by ---.' };
    const doc = parseDocument(match[1]!, { uniqueKeys: true, customTags: [] });
    if (doc.errors.length) return { frontmatter: {}, body: content.slice(match[0].length), frontmatterError: doc.errors.map(e => e.message).join('; ') };
    const value: unknown = doc.toJS();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { frontmatter: {}, body: content.slice(match[0].length), frontmatterError: 'Frontmatter must be a YAML mapping.' };
    return { frontmatter: value as Record<string, unknown>, body: content.slice(match[0].length) };
  } catch { return { frontmatter: {}, body: content, frontmatterError: 'Frontmatter could not be parsed safely.' }; }
}
function parseJson(s?: string): Record<string, unknown> | undefined { if (!s) return; try { const x: unknown = JSON.parse(s); return x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : undefined; } catch { return; } }
