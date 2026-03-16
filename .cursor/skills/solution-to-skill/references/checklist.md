# Extraction Checklist

Use when extracting a documented solution into a learning skill.

## Pre-Extraction

- [ ] Solution doc exists in `docs/solutions/` with clear problem, root cause, and fix
- [ ] Fix is actionable (agent can apply it without guessing)
- [ ] Issue is likely to recur (integration, env, build, or common config)

## Skill Creation

- [ ] Skill name: lowercase, hyphens, descriptive (e.g. `vitest-env-setup`)
- [ ] Description: third person, includes trigger terms (symptoms, error messages)
- [ ] SKILL.md: trigger, workflow, root cause, what does not work
- [ ] References: detailed patterns in `references/` if needed

## Cross-References

- [ ] Solution doc: add "Extracted to: `.cursor/skills/<name>/`" in Related section
- [ ] `critical-patterns.md`: add if pattern is required reading
- [ ] Dependent skills: update prerequisites (e.g. regression-sentinel) if needed

## Verification

- [ ] Skill description would match the symptom when an agent searches
- [ ] Run a quick sanity check: "When would I use this skill?" → answer is clear
