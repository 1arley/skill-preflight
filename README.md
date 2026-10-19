# skill-preflight

Deterministic, offline pre-publication checks for folders containing `SKILL.md`. It reports format, structure, static security, supply-chain, documentation, evaluation, and portability findings with stable IDs, exact locations, and suggested fixes. It does not execute the audited skill or make network/model calls.

## Install and run

The bundled auditor needs Node.js 22 or newer and has no runtime dependencies:

```sh
node scripts/preflight.mjs /path/to/skill --profile default --format text
node scripts/preflight.mjs /path/to/skill --format json --out report.json
node scripts/preflight.mjs /path/to/skill --format sarif
```

Install the skill into your agent with the skills CLI:

```sh
npx skills add https://github.com/1arley/skill-preflight --skill skill-preflight
```

Or copy `skills/devtools/skill-preflight` into the directory your agent reads skills from.

## Example output

```text
skill-preflight sample-skill (default)
0 errors · 1 warnings · 0 info
WARNING SEC-001 scripts/publish.mjs:18 Outbound network access is statically referenced.
  Fix: remove it or document a narrow, user-approved purpose
```

## Profiles and options

`default` runs every rule. `strict` runs every rule and promotes warnings to a failing exit code. `agensi` runs a distinct subset of the rules that maps to Agensi's public security categories: file structure, file types, dangerous commands, secrets, environment-variable harvesting, network access, obfuscation, and prompt-injection screening. The `agensi` profile is a local heuristic; it is not their scanner, it does not reproduce private rules, and it cannot predict a marketplace decision. `--strict` promotes warnings for any profile.

Formats: `text`, `json`, `sarif`, and `md`. Use `--only ID,...`, `--skip ID,...`, `--explain ID`, `--ignore-file FILE`, or `--out FILE`. A suppression file is a JSON array of `{ "id", "file", "reason" }` entries; an empty reason is an error. The JSON contract is versioned in [`schemas/report.v1.json`](schemas/report.v1.json). See [the rule catalog](skills/devtools/skill-preflight/references/rules.md) for IDs and profile membership.

## Evals

`npm run eval` executes the behavioral task corpus in [`evals/evals.json`](skills/devtools/skill-preflight/evals/evals.json) against the fixtures under `test/fixtures` and fails when an assertion fails. Trigger positives and negatives are validated for shape only, because deciding whether a description activates needs a model.

## CI

Fail on errors and warnings:

```yaml
- run: node scripts/preflight.mjs ./skills/my-skill --profile strict --format sarif --out results.sarif
  continue-on-error: true
- uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: results.sarif
```

The upload step requires the repository's code-scanning permissions and GitHub plan support. Use the CLI exit code as the gate; the example above keeps upload separate from the audit status.

## Privacy and limits

The CLI reads bounded regular files under the selected skill directory and does not follow symlinks. It never executes audited files, writes into the target, opens a network connection, sends content to a service, or logs file contents. It writes a report only to stdout unless `--out` is supplied. `--ignore-file` explicitly reads the named suppression configuration. The removal path is simply to delete the installed skill directory or remove it through the agent's skill manager; there are no settings, credentials, or background processes to clean up.

Static checks are heuristics: they can produce false positives and miss novel or obfuscated behavior. A clean report does not establish that a skill is safe, correct, or accepted by any marketplace. The qualitative rubric is performed by the host agent, outside the script.

## Development

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint
npm test
npm run eval
npm run build
npm run check:bundle
npm run audit:self
```

`npm test` enforces a 90% line-coverage floor over `src/`. `npm run check:bundle` rebuilds the committed bundle and fails when the generated artifacts drift from the committed ones. `npm run audit:self` runs the auditor on the bundled skill and must stay clean under `--strict`. CI runs the same checks on Linux, macOS, and Windows with Node.js 22 and 24.

## pt-BR

`skill-preflight` faz verificações determinísticas e offline em pastas com `SKILL.md`: formato, estrutura, segurança estática, supply chain, documentação, evals e portabilidade. O bundle exige Node.js 22+ e não tem dependências em runtime. Ele não executa os arquivos auditados, não segue symlinks, não faz chamadas de rede ou a modelos e não grava dentro da skill. O relatório vai para stdout, salvo quando `--out` é informado.

O perfil `agensi` roda um conjunto distinto de regras inspirado nas categorias públicas do Agensi; ele é heurístico, não reproduz o scanner privado e não prevê aprovação. `npm run eval` executa o corpus de tarefas comportamentais contra os fixtures locais e falha quando uma asserção falha. Instale com `npx skills add https://github.com/1arley/skill-preflight --skill skill-preflight`, ou copie `skills/devtools/skill-preflight` para a pasta de skills do seu agente. Para remover, apague o diretório instalado ou use o gerenciador de skills do agente.
