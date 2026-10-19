# Research notes

Checked 2026-10-19. Only findings that affect design are recorded here.

## SKILL.md format and portability

Agensi's format reference says a skill has YAML frontmatter and a Markdown body; `name` and `description` are required. `name` must match the folder and contain lowercase letters, digits, and hyphens. The description should be one to three sentences: capability first, then activation conditions with varied trigger wording. `when_to_use`, `allowed-tools`, and `disable-model-invocation` are optional. The reference reports inconsistent support for optional fields across agents: `when_to_use` is partial, `allowed-tools` is not enforced by several agents, and `context: fork` / `hooks` are Claude Code-specific. The checker therefore treats unknown and agent-specific fields as information, not universal errors.

Source: [SKILL.md Format Reference](https://www.agensi.io/learn/skill-md-format-reference).

## Skill authoring and evaluation

The locally available `skill-creator` guidance recommends a discriminating, capability-first description, progressive disclosure (short entrypoint, detailed conditional references), concrete examples, and executable behavioral evaluations rather than generic instruction. The skill entrypoint will document only the workflow; detailed security rules and qualitative judgment live in references. Evaluation tasks and trigger positives/negatives are separate fixtures.

Source: `/home/iarley/.codex/skills/.system/skill-creator/SKILL.md`.

## Reference repository conventions

The local checkout of [grill-with-jev](https://github.com/1arley/grill-with-jev) keeps its skill under `skills/<category>/<name>/`, includes explicit privacy/security and operational references, has end-to-end evals, and runs typecheck, tests, and Gitleaks in GitHub Actions. Its dependencies are pinned and installation uses `npm ci --ignore-scripts`. This project follows those conventions, adds generated rule documentation, bundle reproducibility, schema, SARIF, and a three-OS matrix. The checkout was at `c798b4684be1af486bb56d95370a2723c386cae5` when checked.

## Agensi public security categories

Agensi publicly lists file structure, file types, dangerous commands, secrets, environment-variable harvesting, network access, obfuscation, and prompt-injection screening. It describes both automated checks and subsequent human review, while withholding detection details. The `agensi` profile in this project is explicitly a local heuristic inspired by those public categories; it cannot reproduce or predict Agensi's private scanner or review.

Source: [Agensi Security & Trust](https://www.agensi.io/security).

## Dependency and runtime decisions

`npm view` on 2026-10-19 returned `yaml` 2.9.1, `zod` 4.6.7, `esbuild` 0.28.2, `typescript` 7.0.2, `tsx` 4.23.15, `fast-check` 4.10.2, and `@types/node` 26.6.5. ESLint is `10.13.0` and the TypeScript ESLint packages are `8.72.0`. YAML parsing uses the `yaml` document API with custom tags disabled. The published runtime is a bundled `.mjs` with no external imports.

TypeScript is pinned to `6.0.3` instead of the `7.0.2` release. The 7.x package is the native compiler: `require('typescript')` no longer exposes `createSourceFile` or `createProgram`, and `@typescript-eslint/parser@8.72.0` declares a peer range of `typescript >=4.8.4 <6.1.0`. Installing the parser against 7.0.2 fails resolution, so linting the TypeScript sources requires the last release that still ships the JavaScript compiler API.

The test runner of Node 22 and 24 supports `--experimental-test-coverage` with the `--test-coverage-lines` threshold and glob patterns for test files, so coverage needs no extra dependency and the same command works on all three operating systems.

## Out of scope / not verified

No marketplace pricing or current competing listings were verified; the suggested US$9 is omitted from claims and retained only as an unverified listing suggestion. Marketplace-specific upload rules and the internals of Agensi's scanner are not public in the cited material. No pricing or approval guarantee is made. The public repository does not exist yet, so no URL is asserted in the product; the URL and the price stay `TODO(verify)` in `LISTING.md`.
