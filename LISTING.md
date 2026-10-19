# Marketplace listing draft

- **Title:** Skill Preflight — Offline Skill Security and Format Audit
- **Short description:** Check a `SKILL.md` folder for format, structure, static security, and supply-chain issues with a deterministic offline CLI.
- **Long description:** Prepare skills for internal review or marketplace submission with stable rule IDs, exact file locations, actionable fixes, and text, JSON, Markdown, or SARIF reports. The bundled CLI has no runtime dependencies, never executes the audited skill, and never sends its contents anywhere. A separate host-agent rubric reviews activation clarity and examples. Checks are heuristic and do not guarantee marketplace acceptance.
- **Tags:** skills, security, developer-tools, audit, supply-chain, offline
- **Price:** TODO(verify): user suggested US$9; verify current marketplace rules and competitor listings immediately before listing.
- **Repository URL:** https://github.com/1arley/skill-preflight
- **Screenshots:** TODO(verify): no marketplace account exists yet, so no screenshot can be produced. The captures below are real CLI output.

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
