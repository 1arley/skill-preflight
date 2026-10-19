import path from 'node:path';
import type { Context, Finding, Report } from './types.js';
import { ReportSchema } from './types.js';

export type Format = 'text' | 'json' | 'sarif' | 'md';

const TOOL = { name: 'skill-preflight', version: '0.1.0' } as const;

export function buildReport(ctx: Context, findings: Finding[]): Report {
  const stable = [...findings].sort((a, b) => a.location.file.localeCompare(b.location.file) || a.location.line - b.location.line || a.id.localeCompare(b.id));
  return ReportSchema.parse({
    schemaVersion: '1.0.0',
    tool: TOOL,
    target: path.basename(ctx.root),
    profile: ctx.profile,
    generatedAt: new Date().toISOString(),
    summary: {
      errors: stable.filter(f => f.severity === 'error').length,
      warnings: stable.filter(f => f.severity === 'warning').length,
      infos: stable.filter(f => f.severity === 'info').length,
    },
    findings: stable,
  });
}

export function renderReport(r: Report, format: Format): string {
  if (format === 'json') return JSON.stringify(r, null, 2);
  if (format === 'md') return `# Skill preflight report\n\nTarget: \`${r.target}\` · Profile: \`${r.profile}\`\n\nErrors: ${r.summary.errors} · Warnings: ${r.summary.warnings} · Info: ${r.summary.infos}\n\n${r.findings.map(f => `- **${f.severity.toUpperCase()} ${f.id}** \`${f.location.file}:${f.location.line}\` — ${f.message} Fix: ${f.suggestion}`).join('\n') || 'No findings.'}\n`;
  if (format === 'sarif') return JSON.stringify(sarif(r), null, 2);
  return `skill-preflight ${r.target} (${r.profile})\n${r.summary.errors} errors · ${r.summary.warnings} warnings · ${r.summary.infos} info\n${r.findings.map(f => `${f.severity.toUpperCase()} ${f.id} ${f.location.file}:${f.location.line} ${f.message}\n  Fix: ${f.suggestion}`).join('\n') || 'No findings.'}\n`;
}

/** SARIF 2.1.0 payload. No documentation URI is published because the project has no public home yet. */
function sarif(r: Report) {
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: { driver: { name: TOOL.name, version: TOOL.version, rules: [...new Map(r.findings.map(f => [f.id, { id: f.id, shortDescription: { text: f.category }, fullDescription: { text: f.message } }])).values()] } },
      results: r.findings.map(f => ({
        ruleId: f.id,
        level: f.severity === 'error' ? 'error' : f.severity === 'warning' ? 'warning' : 'note',
        message: { text: `${f.message} Suggested fix: ${f.suggestion}` },
        locations: [{ physicalLocation: { artifactLocation: { uri: f.location.file }, region: { startLine: f.location.line } } }],
      })),
    }],
  };
}
