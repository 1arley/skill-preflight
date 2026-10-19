# Report formats

The CLI supports `text`, `json`, `sarif`, and `md`. JSON is validated against `schemas/report.v1.json`; SARIF output uses version 2.1.0 and can be uploaded with GitHub's `upload-sarif` action. Each finding carries a stable rule ID, severity, category, message, `file:line` location, and suggested correction. Timestamps are UTC ISO 8601.

Exit codes: `0` clean, `1` warnings when `--strict` or profile `strict` is used, `2` one or more errors, `64` invalid usage, and `70` an internal/read error. Information findings never affect the exit status. Ignore entries require a non-empty reason and match rule ID plus file path.
