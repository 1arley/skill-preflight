# Security and privacy

The audited folder is untrusted input. The auditor CLI reads only regular files beneath the selected skill root, never follows symlinks, never executes skill content, never writes into the target, and makes no network requests or model calls. By default it writes its report to stdout. `--out` is the only report-writing option.

Traversal is bounded to 500 files, depth 12, 1 MB per readable file, and 20 MB aggregate. Files over a bound are not inspected; oversized trees can therefore have incomplete findings. Symlinks are reported and their targets are not read, even when they point back into the skill. The explicit `--ignore-file` option reads the named suppression file; `--out` writes the named report path. These paths are caller-selected and are separate from audited content.

Static rules are heuristic. A match can be benign, and obfuscated or novel behavior can evade pattern checks. Secret detection uses recognizable patterns and a review heuristic, not a credential validator. The `agensi` profile is inspired by public categories at [Agensi Security](https://www.agensi.io/security); it is not the Agensi scanner, does not reproduce private rules, and cannot predict approval.

No telemetry, analytics, external services, or runtime dependency downloads are included. To stop using the skill, stop invoking it and delete its folder or remove it with the installing agent's skill manager. No user-level settings or credentials are created.
