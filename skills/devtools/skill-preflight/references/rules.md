# Rule catalog

Generated from the rule registry. Run `npm run catalog` after rule metadata changes.

| ID | Severity | Category | Agensi profile | Summary |
|---|---|---|---|---|
| FM-001 | error | frontmatter | yes | Frontmatter is valid YAML mapping |
| FM-002 | error | frontmatter | no | Name matches the folder and portable syntax |
| FM-003 | error | frontmatter | no | Description is present and 1–3 sentences |
| FM-004 | warning | frontmatter | no | Description explains what and when |
| FM-005 | warning | frontmatter | no | Optional portable fields use valid types |
| FM-006 | info | frontmatter | no | Unknown frontmatter fields are informational |
| FM-007 | info | frontmatter | no | Agent-specific fields are marked for portability |
| ST-001 | warning | structure | no | SKILL.md stays under 500 lines |
| ST-002 | warning | structure | yes | Referenced local files exist |
| ST-003 | warning | structure | yes | Relative links resolve inside the skill |
| ST-004 | warning | structure | no | Large references have an index |
| ST-005 | warning | structure | yes | Scripts have executable permission |
| ST-006 | warning | structure | yes | Unexpected binary files are reviewed |
| ST-007 | warning | structure | yes | Symlinks stay within the target root |
| SEC-001 | warning | security | yes | Outbound network access is statically referenced. |
| SEC-002 | warning | security | yes | Environment variable access may expose credentials. |
| SEC-003 | warning | security | yes | Access to credential stores or tokens is referenced. |
| SEC-004 | warning | security | yes | Broad filesystem enumeration is referenced. |
| SEC-005 | warning | security | yes | Dynamic code evaluation is referenced. |
| SEC-006 | warning | security | yes | Shell command construction appears to interpolate input. |
| SEC-007 | warning | security | yes | Large encoded, minified, or obfuscated content is present. |
| SEC-008 | error | security | yes | A recognizable secret pattern is present. |
| SEC-009 | warning | security | yes | Prompt-injection or concealment language is present. |
| SEC-010 | warning | security | yes | HTML comment contains instruction-like or sensitive wording. |
| SEC-011 | warning | security | yes | Invisible or bidirectional Unicode control character is present. |
| SEC-012 | warning | security | yes | Markdown image loads from a remote URL and can disclose access metadata. |
| SEC-013 | warning | security | yes | Secret-like high-entropy strings are reviewed |
| SUP-001 | warning | supply-chain | yes | Package lifecycle scripts are absent |
| SUP-002 | warning | supply-chain | no | Dependencies use exact versions |
| SUP-003 | warning | supply-chain | no | Package lockfile is present |
| SUP-004 | warning | supply-chain | yes | Dependencies use an approved public registry |
| SUP-005 | warning | supply-chain | no | Documentation recommends safe installation |
| DOC-001 | error | documentation | no | License file is present |
| DOC-002 | warning | documentation | no | README documents installation, privacy, and removal |
| DOC-003 | warning | documentation | no | Changelog is present |
| DOC-004 | error | documentation | no | Security guidance is present |
| DOC-005 | warning | documentation | no | Declared derivative preserves attribution |
| EVAL-001 | error | evaluation | no | Executable eval task corpus exists |
| EVAL-002 | error | evaluation | no | Trigger corpus has positive and negative queries |
| PORT-001 | info | portability | no | Claude Code-only fields are identified |
