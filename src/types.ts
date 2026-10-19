import { z } from 'zod';

export const FindingSchema = z.object({
  id: z.string().regex(/^[A-Z]+-\d{3}$/), severity: z.enum(['error', 'warning', 'info']),
  category: z.string(), message: z.string(), location: z.object({ file: z.string(), line: z.number().int().positive() }),
  suggestion: z.string(),
});
export const ReportSchema = z.object({
  schemaVersion: z.literal('1.0.0'), tool: z.object({ name: z.literal('skill-preflight'), version: z.string() }),
  target: z.string(), profile: z.enum(['default', 'strict', 'agensi']), generatedAt: z.string(),
  summary: z.object({ errors: z.number().int().nonnegative(), warnings: z.number().int().nonnegative(), infos: z.number().int().nonnegative() }),
  findings: z.array(FindingSchema),
});
export type Finding = z.infer<typeof FindingSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type RuleMeta = { id: string; severity: Finding['severity']; category: string; summary: string; rationale: string; badExample: string; goodExample: string };
export type FileEntry = { path: string; absolute: string; content?: string; bytes: number; mode: number; binary: boolean; symlink: boolean };
export type Context = { root: string; folder: string; files: FileEntry[]; byPath: Map<string, FileEntry>; skill: FileEntry; frontmatter: Record<string, unknown>; body: string; frontmatterError?: string; profile: 'default'|'strict'|'agensi'; packageData?: Record<string, unknown>; lockfiles: string[] };
export type Rule = { meta: RuleMeta; check: (ctx: Context) => Finding[] };
export const finding = (rule: RuleMeta, file: string, line: number, message: string, suggestion = rule.goodExample): Finding => ({ id: rule.id, severity: rule.severity, category: rule.category, message, location: { file, line: Math.max(1, line) }, suggestion });
