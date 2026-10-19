# sample-skill

A complete, portable skill folder used to prove the preflight auditor reports nothing for a well-formed skill.

## Install

Copy the folder into the directory your agent reads skills from. There are no runtime dependencies and no install scripts.

## Privacy

The skill reads only the files inside the folder it is given. It sends nothing over the network, stores nothing outside that folder, and reports no telemetry.

## Remove

Delete the folder. There are no settings, credentials, or background processes left behind.

## Security

The skill is static text with no executable code. See [references/security.md](references/security.md).
