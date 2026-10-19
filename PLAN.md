# Plan

## Architecture

- `src/` contains the strict TypeScript CLI, bounded filesystem reader, Zod report contract, and pure rule modules.
- The CLI parses only local inputs, never executes audited files, and writes only stdout or an explicitly requested `--out` report. It produces stable findings in text, JSON, SARIF 2.1.0, or Markdown.
- `scripts/preflight.mjs` is a committed esbuild bundle with no runtime dependencies. `npm run build` rebuilds it; CI verifies a clean diff and the SHA256 manifest.
- The qualitative rubric is for the host agent only. The deterministic script never calls a model or network.
- Rules are grouped as FM, ST, SEC, SUP, DOC, EVAL, and PORT. The registry drives `--explain` and generated `references/rules.md`; tests enforce metadata completeness and positive/negative examples.

## Rule families

- FM: required and correctly typed portable frontmatter, folder/name, description length and trigger coverage, unknown fields, agent-specific portability.
- ST: line limits, local references and links, references index/size, script executable bit, binary files, escaping symlinks.
- SEC: network APIs/commands, environment and secret-store access, disk scans, eval, interpolated child processes, encoded/minified content, secret indicators, prompt injection, hidden HTML instructions, invisible/bidi Unicode, remote Markdown images.
- SUP: lifecycle hooks, floating dependencies, registry policy, lockfile, safe `npm ci --ignore-scripts` guidance.
- DOC: license, attribution, README install/privacy/removal, changelog, security section.
- EVAL: valid task evals and trigger positive/negative corpus minimums.
- PORT: Claude Code-only fields are informational.

Severity and profile selection remain metadata-driven. `--strict` promotes warnings to errors; ignore entries require a written reason. Error exit is 2, strict warnings 1, clean 0, usage 64, internal failure 70.

## Delivery order

1. Add this plan, source research, and decisions; establish Git.
2. Add package metadata, report schema, CLI parsing, bounded safe filesystem context, and rule registry.
3. Implement rule modules and serializers, then generate rule reference and report schema artifacts.
4. Add realistic good/bad fixtures, unit/property/robustness/golden/CLI tests, and executable offline evals.
5. Write the skill, security/rubric/report docs, README, release metadata, listing material, and examples.
6. Build reproducibly, run checks locally, dogfood the bundled skill, and adjust findings until clean.
7. Add cross-platform CI, Gitleaks, npm audit, changeset, checksums, and semantic commits by logical unit.

## Safety limits

Read only regular files beneath the resolved target root, cap total files, per-file bytes, total bytes, and depth, and never execute target content. Refuse a target root that is itself a symlink. Do not read through symlinks; report their containment without following them. This preserves the no-outside-read guarantee, at the cost of not inspecting legitimate symlink targets. A `--out` path is the only permitted write.
