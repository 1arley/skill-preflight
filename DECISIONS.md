# Decisions

- **Use the requested empty workspace as the project root and initialize Git.** It contains only an empty `graphify-out/`; there was no existing project to preserve or adapt.
- **Pin all direct dependencies and commit `package-lock.json`.** Deterministic installs are required for supply-chain review; the selected versions were checked with `npm view` on 2026-10-19 (see `docs/research.md`).
- **Use `yaml` document parsing, not a hand-written YAML subset.** It supports real frontmatter syntax; custom tags are disabled and malformed/duplicate keys are reported.
- **Never follow target symlinks, even within the target.** Following any link would make the strict “no reads outside target” guarantee difficult to uphold portably. Symlinks are reported; linked content is not inspected.
- **Bound traversal and individual/aggregate file sizes.** The CLI is intended for untrusted input, so oversized targets are skipped with explicit findings rather than risking unbounded memory/time.
- **Allow dependency registries by default only for npmjs.org.** A configured non-public/private registry may be valid in internal use, but requires an explicit rule suppression with justification until allowlist configuration is designed.
- **Use `npx skills add` only as listing guidance.** Network access is prohibited at audit runtime; installation commands run outside the auditor.
- **The Agensi profile is heuristic and inspired by public categories.** Public rules are not the marketplace's private patterns or threshold; never claim scan equivalence or approval prediction.
- **No marketplace price or competitor claim is asserted.** The requested US$9 suggestion was not independently verified and remains `TODO(verify)` before any listing.
- **Screenshots are deterministic text captures, not fabricated marketplace screenshots.** The repository has no marketplace account or approved publication context.
- **Qualitative skill quality is appended only by the host agent using `references/rubric.md`.** Scripts do not call an LLM and cannot infer semantic usefulness.
