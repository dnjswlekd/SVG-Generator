# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root unless noted:

- `npm run dev` — boot client and server in parallel via `concurrently` (output prefixed `[client]` / `[server]`). `npm run --workspaces` runs sequentially and will block on whichever workspace starts first, so always go through this script, not the workspaces flag.
- `npm run dev:client` / `npm run dev:server` — boot one side only.
- `npm run build` — runs `build` in every workspace that defines it (`tsc -b && vite build` in client, `tsc` in server).
- Type check without building: `npx tsc -b client/tsconfig.json` for the client (project references), `cd server && npx tsc --noEmit` for the server.

Ports are wired together — do not change one without the other:

- client: `5173` (Vite)
- server: `8787` (Hono via `@hono/node-server`)
- `client/vite.config.ts` proxies `/api/*` to `http://localhost:8787`, so the frontend always calls `/api/...` (no absolute URL, no CORS setup).

Server env lives in `server/.env` (see `server/.env.example`). `ANTHROPIC_API_KEY` is required once the placeholder is replaced with a real call.

## Architecture

npm workspaces monorepo, two packages:

- **`client/`** — Vite 6 + React 19 + TypeScript + Tailwind v4. Tailwind is wired through the `@tailwindcss/vite` plugin and a single `@import "tailwindcss";` in `src/index.css` — there is intentionally no `tailwind.config.js` or `postcss.config.js`. TS uses project references (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`); editing `vite.config.ts` is covered by the `node` project, app code by the `app` project. `src/App.tsx` is the layout shell (left-half = `PromptInput` over `CodeEditor`, right-half = `SvgPreview`); the three components under `src/components/` are placeholder UI shells, not wired to any state or fetch yet.

- **`server/`** — Hono 4 on Node via `@hono/node-server`, dev runs through `tsx watch`. The single route is `POST /api/generate`, which currently returns `{ svg: "<!-- placeholder for: <prompt> -->" }`. The Anthropic call is a TODO at this exact spot — when implemented, it should still return JSON shaped `{ svg: string }` so the client contract stays the same.

Shared TS config lives in `tsconfig.base.json` at the root; both workspaces extend it.

## Current state

This is an early scaffold. Intentionally not yet implemented (do not assume these exist):

- Real Anthropic API call in `server/src/index.ts` (placeholder response only).
- Monaco integration in `client/src/components/CodeEditor.tsx` (renders a static `<div>`).
- Any wiring between `PromptInput`'s `Generate` button and the server (`disabled`, no handler).
- Any state management or fetch logic on the client.
