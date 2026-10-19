---
name: skill-preflight
description: Audits a skill folder for format, structure, static security, and supply-chain issues. Use when someone says “audit this skill”, “check my SKILL.md”, “is this skill safe to publish”, “lint skill”, or “prepare for marketplace”.
when_to_use: Use for a deterministic pre-publication review of a folder containing SKILL.md. Do not use to claim marketplace approval or to repair files automatically.
---

# Skill Preflight

Audit the supplied skill folder before publication. The audit script treats that folder as untrusted data: it never executes its files, calls a model, or makes network requests. This matters because skills can contain instructions or code that act with an agent's permissions.

1. Run the bundled auditor from the folder that contains this file: `node scripts/preflight.mjs <skill-folder> --format json`. In the source repository the same command is `node skills/devtools/skill-preflight/scripts/preflight.mjs <skill-folder> --format json`.
2. Read the JSON report and explain each error, warning, and informational portability note in plain language.
3. Apply the qualitative rubric in [references/rubric.md](references/rubric.md) to activation clarity, examples, and likely under-activation. Label that judgment separately from deterministic findings.
4. Present one combined report. Keep every deterministic rule ID and `file:line` location, then append the rubric assessment and its evidence.
5. Suggest focused corrections. Do not edit the audited skill unless the user explicitly asks you to make those corrections.

The `agensi` profile is heuristic and inspired by Agensi's public security categories. It does not reproduce their private scanner or predict a marketplace decision. Read [references/security.md](references/security.md) before interpreting security findings and [references/report-format.md](references/report-format.md) when converting report formats.

## Example

Input:

```text
node scripts/preflight.mjs ./my-skill --profile default --format json
```

Deterministic output excerpt:

```json
{
  "schemaVersion": "1.0.0",
  "summary": { "errors": 0, "warnings": 1, "infos": 0 },
  "findings": [{
    "id": "SEC-001", "severity": "warning", "category": "security",
    "message": "Outbound network access is statically referenced.",
    "location": { "file": "scripts/run.mjs", "line": 12 },
    "suggestion": "remove it or document a narrow, user-approved purpose"
  }]
}
```

The host agent adds a separate qualitative section, for example: “Activation: clear; the description names the task and includes user phrasing. Evidence: the description contains distinct audit and publication triggers.” The script never supplies that judgment.
