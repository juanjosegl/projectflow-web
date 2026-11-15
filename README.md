# ProjectFlow Web

[![CI](https://github.com/juanjosegl/projectflow-web/actions/workflows/ci.yml/badge.svg)](https://github.com/juanjosegl/projectflow-web/actions/workflows/ci.yml)

Frontend for **ProjectFlow**, a team task manager with kanban boards, roles, invitations, comments and notifications.
API: [projectflow-api](https://github.com/juanjosegl/projectflow-api).

**Live demo: https://projectflow-web-rho.vercel.app**. Click **Open the live demo** to sign in as the admin of a ready-made demo team. You don't need an account. The demo data resets itself regularly, so feel free to move things around.

## Features

- **Kanban board** with drag and drop between Backlog, To do, In progress, In review and Done (optimistic updates, rolled back if the server refuses)
- **Tasks**: priority, assignee, due date with overdue highlighting, inline editing, comments
- **Teams**: invite by email, accept or decline invitations, change roles, remove members, leave a team, team progress
- **Dashboard**: personal workload by status, overdue tasks, tasks completed this week
- **Notifications** when work is assigned to you, changes status or gets a comment; each one links to its task
- **Auth**: email/password and Google, short-lived access token with silent refresh
- **Light / dark theme** and **English / Spanish**, both remembered

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · TanStack Query · Zustand · React Hook Form + Zod · Tailwind CSS 4 · shadcn/ui (Base UI) · next-intl · Sonner

## Structure

```
src/
  app/            routes: landing, auth, dashboard, teams, projects/[id] (board), tasks, notifications, profile
  components/     ui (shadcn), layout (sidebar, topbar), shared, landing
  lib/            axios client with refresh interceptor, typed API services, query client
  store/          auth and UI state (zustand, persisted)
  hooks/          auth guards and demo sign-in
messages/         en.json, es.json
```

## Run locally

Start the [API](https://github.com/juanjosegl/projectflow-api) first, then:

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
pnpm install
pnpm dev                     # http://localhost:3000
```
