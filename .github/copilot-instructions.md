# Copilot Instructions Entrypoint

Start with [AGENTS.md](../AGENTS.md) for the workspace-wide rules, commands, architecture notes, and verification expectations.

Then apply the scoped instruction file that matches the files you are editing:

- Use [instructions/frontend.instructions.md](instructions/frontend.instructions.md) for `app/**/*.{ts,tsx,css}`, `components/**/*.{ts,tsx}`, and `hooks/**/*.{ts,tsx}`.
- Use [instructions/backend.instructions.md](instructions/backend.instructions.md) for `app/api/**/*.{ts,tsx}`, `lib/services/**/*.ts`, `lib/db/**/*.ts`, `lib/ai/**/*.ts`, and `prisma/**/*.prisma`.
- Use [instructions/tests.instructions.md](instructions/tests.instructions.md) for `tests/**/*.{ts,tsx}` and `**/*.{test,spec}.{ts,tsx}`.

When multiple files are involved, follow [AGENTS.md](../AGENTS.md) as the shared baseline and then follow the most specific scoped instruction for each file.