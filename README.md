# Team Workspace SaaS Dashboard

A Vue 3 + TypeScript SaaS workspace app inspired by Jira-style collaboration flows.

This project has evolved from an analytics dashboard into a **team collaboration workspace** with:
- authentication
- project and task lifecycle management
- board and detail views
- member role management
- global search
- notification center

The current implementation is mock-data driven for domain entities (workspace/projects/tasks), while auth still uses a mock API.

---

## Product Scope (Current)

### Auth
- Login and register flows
- Route guards for guest-only and authenticated routes
- Local token persistence

### Workspace Core
- Workspace overview metrics
- Project list + project detail
- Task list + task detail
- Board view (status-column workflow)
- Member list + role update
- Settings (profile/theme/workspace metadata)

### Task Flow (Phase 3)
- Task status updates (`Backlog` / `In Progress` / `In Review` / `Done`)
- Assignee updates
- Project reassignment
- Task description editing
- Task comments and activity timeline (mocked, persisted in client state)

---

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia
- Vue Router
- Tailwind CSS
- Headless UI
- Heroicons
- date-fns
- Express (mock auth/API server)

---

## Architecture Overview

### Frontend
- `src/stores/dataStore.ts` is the central workspace domain store
- Domain is seeded from `src/utils/mockData.ts`
- Main domain types are in `src/types/index.ts`
- Shared layout: sidebar + topbar + routed content

### API Layer
- `src/api/client.ts` currently exposes auth API calls only
- Dev default base URL: `http://localhost:4000`
- Prod default base URL: same-origin (`/api/*`)

### Backend Mock
- `mock-server/server.cjs` contains in-memory Express endpoints
- `api/[[...path]].js` allows Vercel serverless routing to reuse the same mock server

---

## Routes

### Public
- `/login`
- `/register`

### Authenticated
- `/` (Overview)
- `/board`
- `/projects`
- `/projects/:id`
- `/tasks`
- `/tasks/:id`
- `/members`
- `/settings`

---

## Data Model

Defined in `src/types/index.ts`:

- `Workspace`
- `Member`
- `Project`
- `Task`
- `TaskComment`
- `TaskActivity`

Key enums:
- `WorkspaceRole`
- `ProjectStatus`
- `TaskStatus`
- `TaskPriority`
- `TaskType`

---

## Project Structure

```text
src/
  api/
    client.ts
  components/
    common/
    layout/
  pages/
    auth/
    Overview.vue
    Board.vue
    Projects.vue
    ProjectDetail.vue
    Tasks.vue
    TaskDetail.vue
    Members.vue
    Settings.vue
  router/
    index.ts
  stores/
    authStore.ts
    dataStore.ts
    settingsStore.ts
    notificationStore.ts
    toastStore.ts
  types/
    index.ts
  utils/
    mockData.ts
```

---

## Getting Started

### Prerequisites
- Node.js `^20.19.0` or `>=22.12.0`
- npm

### Install

```bash
npm install
```

### Run Frontend

```bash
npm run dev
```

Default app URL: `http://localhost:5173`

### Run Mock Auth API (Recommended for login/register)

In another terminal:

```bash
cd mock-server
npm install
npm start
```

Default API URL: `http://localhost:4000`

### Build

```bash
npm run build
```

---

## Available Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – type-check + production build
- `npm run preview` – preview built app
- `npm run type-check` – run `vue-tsc`
- `npm run lint` – run ESLint with `--fix`
- `npm run format` – run Prettier on `src/`

---

## Notes and Current Limitations

- Workspace/project/task domain data is currently seeded locally (no persistent backend for collaboration entities yet).
- Comments and activity timeline are client-side state only.
- Authorization is role-labeled in UI/store but not yet enforced as strict permission gates.
- Board interactions are action-based (move buttons), not drag-and-drop yet.

---

## Suggested Next Steps

1. Implement role-based authorization policies (action-level guards).
2. Add persistent backend APIs for projects/tasks/comments/activity.
3. Add real-time updates (WebSocket/SSE) for task and board changes.
4. Introduce dashboard widget configuration persistence per user/workspace.
5. Add tests for store logic and route guards.
