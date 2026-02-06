# Kanban Design (Convex)

A React + TypeScript + Vite kanban app backed by Convex.

## Stack

- React 19 + Vite
- Convex (queries, mutations, schema)
- Convex Auth (`@convex-dev/auth`) with email/password
- Tailwind CSS
- Vitest + Testing Library

## Features

- Password-based sign in and sign up via Convex Auth
- Auth-guarded routes (`/login`, `/projects`, `/board/:projectId`)
- Projects persisted in Convex (no placeholder/mock data)
- Kanban board with drag-and-drop task movement
- Role-based member management (`owner`, `admin`, `member`)
- Existing-user invites via email search

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Start Convex + frontend together:

```bash
npm run dev
```

This runs both `convex dev` and `vite`.  
If you need non-interactive setup in an automated environment:

```bash
CONVEX_AGENT_MODE=anonymous npx convex dev --once
```

The app expects `VITE_CONVEX_URL` in `.env.local`.

## Auth and backend layout

- `convex/schema.ts`: auth tables + projects/tasks/members/profiles
- `convex/auth.ts`: Convex Auth setup with password provider
- `convex/http.ts`: auth HTTP routes
- `convex/projects.ts`: list/create/get board queries/mutations
- `convex/tasks.ts`: create/update/move/quick-add task mutations
- `convex/memberships.ts`: invite/update/remove members with permission checks
- `convex/users.ts`: profile upsert + invite email search

## Scripts

```bash
npm run dev       # convex + frontend dev servers
npm run build     # typecheck + production build
npm run lint      # eslint
npm run test:run  # vitest (single run)
```
