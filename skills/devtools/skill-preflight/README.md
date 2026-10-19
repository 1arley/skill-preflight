# skill-preflight

Deterministic, offline pre-publication checks for a folder that contains `SKILL.md`.

## Install

Copy this folder into the directory your agent reads skills from. The bundled auditor needs Node.js 22 or newer and has no runtime dependencies.

## Use

Download the auditor once. It is a single self-contained file with no runtime dependencies:

```sh
curl -fsSL https://raw.githubusercontent.com/1arley/skill-preflight/main/scripts/preflight.mjs -o /tmp/skill-preflight.mjs
```

Then run it on the folder you want reviewed:

```sh
node /tmp/skill-preflight.mjs ./path/to/skill --profile default --format text
```

`npx --yes github:1arley/skill-preflight ./path/to/skill --format text` is the one-command alternative.

Every finding carries a stable rule ID, the exact file and line, and a suggested fix. Reports are available as `text`, `json`, `sarif`, and `md`.

## Privacy

The auditor reads only regular files under the folder you select, never follows symlinks, never executes the audited files, and never makes network or model calls. The report goes to stdout unless you pass `--out`. Nothing is uploaded and no telemetry is collected.

## Remove

Delete this folder, or remove it with the agent's skill manager. There are no settings, credentials, or background processes to clean up.

## Security

Static checks are heuristics: they can produce false positives and miss novel behavior, and a clean report does not establish that a skill is safe. Read [references/security.md](references/security.md) for the trust model, [references/rubric.md](references/rubric.md) for the qualitative review the host agent adds, [references/report-format.md](references/report-format.md) for the output formats, and [references/rules.md](references/rules.md) for the rule catalog.
