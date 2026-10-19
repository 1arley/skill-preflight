# Security policy

Please report security issues privately to the repository maintainer before public disclosure. Do not include real credentials in reports. The auditor is offline and treats scanned folders as untrusted data, but static checks cannot guarantee safety.

The CLI does not execute skill files, follow symlinks, read outside the selected root, make network requests, or write into the target. Explicit `--ignore-file` and `--out` paths are the only caller-directed external config read and report write.
