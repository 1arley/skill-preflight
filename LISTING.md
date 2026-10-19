# Marketplace listing draft

- **Title:** Skill Preflight — Offline Skill Security and Format Audit
- **Short description:** Audit a `SKILL.md` folder for format, structure, static security, and supply-chain issues before you publish, with a deterministic offline CLI.
- **Long description:** Publish your skill with the review pass already done. Skill Preflight scans a `SKILL.md` folder for format, structure, static security, and supply-chain issues, then reports stable rule IDs, exact file locations, and actionable fixes. Reports come as text, JSON, Markdown, or SARIF, so you can gate CI on it. The CLI has no runtime dependencies, never executes the audited skill, and never sends its contents anywhere. A separate host-agent rubric reviews activation clarity and examples. Checks are heuristic and do not guarantee marketplace acceptance.
- **Tags:** skills, security, developer-tools, audit, supply-chain, offline
- **Price:** US$7 at launch, US$9 afterwards. Set by the owner on 2026-10-19; competitor pricing and marketplace rules were not independently verified, so re-check both immediately before publishing.
- **Repository URL:** https://github.com/1arley/skill-preflight
- **Screenshots:** TODO(verify): no marketplace account exists yet, so no screenshot can be produced. The captures below are real CLI output.

## Positioning (internal, not published copy)

- **Audience:** skill authors who publish to marketplaces such as Agensi.
- **Value:** the audit replaces a manual review pass, so a creator ships with the format, security, and supply-chain checklist already done.
- **Market size:** the owner states Agensi already lists more than 1,500 skills. Treat that number as unverified and keep it out of the public copy.

## Output captures

These captures are representative CLI output, not marketplace screenshots.

### Clean

```text
skill-preflight my-skill (default)
0 errors · 0 warnings · 0 info
No findings.
```

### Security warning

```text
skill-preflight my-skill (agensi)
0 errors · 1 warnings · 0 info
WARNING SEC-001 scripts/fetch.mjs:12 Outbound network access is statically referenced.
  Fix: remove it or document a narrow, user-approved purpose
```

### Strict CI

```text
skill-preflight my-skill (strict)
0 errors · 1 warnings · 0 info
exit code: 1
```
