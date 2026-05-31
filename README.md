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

This repo is **generated** — don't hand-edit templates here. They come from `apps/templates/*` in the framework monorepo: `workspace:*` deps are rewritten to the matching published `@kuralle-agents/*` version, and `.gitignore` is stored as `_gitignore` (the CLI restores it on scaffold). Run `npm run build-starter` in the framework repo, then publish here and tag the matching `vMAJOR.MINOR`.

## License

MIT
