# Qualitative rubric

Use this rubric only after reading the deterministic report. Keep judgments separate from rule findings and cite a short quotation or a file and line as evidence. Do not call this a security scan.

## Description clarity

- Does the first sentence state the concrete capability and expected result?
- Do later sentences name realistic user requests and boundary cases?
- Are trigger phrases specific enough to distinguish this skill from nearby skills?

## Example quality

- Are examples complete enough to follow without inventing missing inputs?
- Do examples show expected output and error handling where relevant?
- Do examples match the actual workflow and available files?

## Activation risk

- Under-activation: would ordinary user phrasing fail to match the description?
- Over-activation: would unrelated tasks match broad words such as “help” or “write”?
- Are exclusions included only where they prevent a likely wrong activation?

Return `clear`, `needs work`, or `uncertain` for each area, with evidence and one focused suggestion. Never claim the skill “works” solely from this rubric.
