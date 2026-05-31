# Kuralle Starter Templates

Official starter templates for [Kuralle](https://github.com/kuralle/kuralle-agents) — the TypeScript framework for conversational AI agents.

You don't clone this repo directly. Scaffold a project with the CLI:

```bash
npm create kuralle-agents@latest my-app
```

It fetches the template you pick from this repo (via [giget](https://github.com/unjs/giget)), sets your project name, and prints the next steps.

## Templates

| Template | What it is |
| --- | --- |
| [`nextjs-chatbot`](./nextjs-chatbot) | A Next.js chat app wired to a Kuralle agent — streaming UI, thread history, and Postgres-ready persistence. |

## How this repo is maintained

Templates here are generated from `apps/templates/*` in the framework monorepo: `workspace:*` dependencies are rewritten to the matching published `@kuralle-agents/*` version, and `.gitignore` is stored as `_gitignore` (npm/git tooling strips a real `.gitignore`; the CLI restores it on scaffold). Each release is tagged `vMAJOR.MINOR` so the CLI fetches a template version that matches its own.

Don't hand-edit templates here — change them in the framework repo and re-publish.

## License

MIT
