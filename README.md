# TeamFlow — Project Management & Team Collaboration Platform

<p align="center">
  <strong>A modern, enterprise-grade project management platform built for agile teams.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vitest-3.x-6E9F18?logo=vitest" alt="Vitest" />
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel" alt="Vercel" />
</p>

<p align="center">
  <strong>Live Demo:</strong> <a href="https://sass-dashboard-bay.vercel.app">https://sass-dashboard-bay.vercel.app</a>
</p>

---

## Overview

TeamFlow is a Jira-inspired project management platform designed for agile teams to plan, track, and deliver work efficiently. It provides a complete workflow from sprint planning to task execution, with real-time notifications, role-based access control, and a comprehensive analytics dashboard.

**Demo account** (after seeding): `alice@demo.com` / `password123`

---

## Features

### Sprint Management
Plan work in time-boxed iterations with a full sprint lifecycle — create sprints, populate them from the backlog, track progress on the sprint board, and complete sprints with automatic unfinished task rollover. Only one sprint can be active per workspace at a time.

### Kanban Board
Visualize work in progress with a four-column board view. Tasks flow through Backlog, In Progress, In Review, and Done stages. Available both as a global board and a sprint-scoped board with real-time progress tracking.

### Project & Task Tracking
Organize work into projects with unique keys. Each task carries a full set of metadata — priority (Low/Medium/High/Critical), type (Feature/Bug/Ops/Research), assignee, reporter, due date, status — with a complete activity timeline and threaded comments.

### In-App Notification System
Real-time notification center with bell icon badge and polling. Automatic notifications triggered by task assignment, status changes, and new comments. Dedicated notifications page with read/unread filtering, pagination, and bulk mark-as-read.

### Team & Member Management
Manage workspace members with role-based access control (Owner, Admin, Member, Guest). Two onboarding paths: direct add with full credential setup, or self-service invite links with 7-day expiration and UUID tokens.

### Analytics Dashboard
Bird's-eye view of workspace health with key metrics — completion rate, task distribution by status, project progress, member workload, and 7-day activity trends.

### Authentication & Security
JWT-based authentication with bcrypt password hashing (10 rounds). Route guards protect authenticated pages. Role-based permissions enforce who can create projects, manage members, and modify workspace settings.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Vue 3 (Composition API) | UI framework |
| TypeScript 5 | Type safety across the full codebase |
| Pinia | State management with reactive stores |
| Vue Router | Client-side routing with auth guards |
| Tailwind CSS | Utility-first styling |
| Headless UI | Accessible dropdown menus & dialogs |
| Heroicons | Icon system |
| date-fns | Date formatting & relative time |
| Vite | Build tool & dev server |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Prisma ORM 6 | Database access, migrations & type-safe queries |
| PostgreSQL (Neon) | Relational database |
| JSON Web Tokens | Stateless authentication (7-day expiry) |
| bcryptjs | Password hashing |
| UUID v4 | Invite token generation |

### Testing

| Technology | Purpose |
|---|---|
| Vitest | TypeScript-native test runner |
| Supertest | HTTP assertion library for Express |
| vi.mock() | Prisma client mocking (no DB required) |

### Infrastructure

| Technology | Purpose |
|---|---|
| Vercel | Frontend hosting & serverless functions |
| Vercel Postgres (Neon) | Managed PostgreSQL database |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Vue 3 Frontend                        │
│  Pinia Stores ← API Client (fetch) → Vue Router → Pages  │
│  NotificationStore (30s polling) · DataStore · AuthStore  │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────┐
│                Express API Server                         │
│  Auth Middleware → Route Handlers → Notification Service   │
│  Routes: auth · workspace · members · projects · tasks    │
│          sprints · notifications                          │
└────────────────────────┬─────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼─────────────────────────────────┐
│                PostgreSQL (Neon)                           │
│  Users · Workspaces · Members · Projects · Tasks          │
│  Sprints · Comments · Activities · Notifications          │
└──────────────────────────────────────────────────────────┘
```

**Local Development:** Frontend (Vite, port 5173) + Backend (Express, port 4000)
**Production:** Vercel serves the static frontend and runs the API as a serverless function.

---

## Data Model

```
User
 └── Notification (1:N)

Workspace
 ├── WorkspaceMember (User ↔ Workspace, with role, status & invite token)
 ├── Project
 │    ├── ProjectMember (Member ↔ Project)
 │    └── Task
 │         ├── TaskComment
 │         └── TaskActivity
 └── Sprint
      └── Task (via optional sprintId, null = backlog)
```

**Key entities:** User, Workspace, WorkspaceMember, Project, ProjectMember, Task, Sprint, TaskComment, TaskActivity, Notification

**Enums:** WorkspaceRole (Owner/Admin/Member/Guest), MemberStatus (Active/Invited), SprintStatus (Planning/Active/Completed/Cancelled), TaskStatus (Backlog/In Progress/In Review/Done), TaskPriority (Low/Medium/High/Critical), TaskType (Feature/Bug/Ops/Research), NotificationType (TaskAssigned/TaskStatusChanged/TaskCommented/SprintStarted/SprintCompleted/MemberAdded/MemberRemoved)

---

## Getting Started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- PostgreSQL database (local or cloud, [Neon](https://neon.tech) recommended)

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### Database Setup

```bash
cd server

# Create a .env file with your database connection
cat > .env << EOF
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-secret-key"
EOF

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with demo data (optional)
npx tsx src/seed.ts
```

### Development

```bash
# Terminal 1 — Start backend (port 4000)
cd server
npm run dev

# Terminal 2 — Start frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Tests

```bash
cd server

# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Production Build

```bash
npm run build
```

---

## Project Structure

```
├── api/
│   └── index.ts                # Vercel serverless entry point
├── server/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (9 models, 7 enums)
│   ├── src/
│   │   ├── routes/              # Express route handlers
│   │   │   ├── auth.ts          #   Authentication (register, login, me)
│   │   │   ├── workspace.ts     #   Workspace info
│   │   │   ├── members.ts       #   Member CRUD + invite system
│   │   │   ├── projects.ts      #   Project CRUD
│   │   │   ├── tasks.ts         #   Task CRUD + comments + activity
│   │   │   ├── sprints.ts       #   Sprint lifecycle management
│   │   │   └── notifications.ts #   Notification CRUD
│   │   ├── services/
│   │   │   └── notificationService.ts  # Notification creation helpers
│   │   ├── middleware/auth.ts   # JWT auth middleware
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── seed.ts              # Database seeder
│   │   ├── index.ts             # Express app setup
│   │   └── __tests__/           # Test setup & helpers
│   │       ├── setup.ts         #   Global Prisma mock
│   │       └── helpers.ts       #   Test utilities & factories
│   └── vitest.config.ts         # Test runner configuration
├── src/
│   ├── api/client.ts            # Frontend API client (typed fetch wrapper)
│   ├── components/
│   │   ├── common/              # Shared UI (DataTable, NotificationCenter, GlobalSearch, etc.)
│   │   └── layout/              # Sidebar, Topbar, DefaultLayout
│   ├── pages/
│   │   ├── auth/                # Login, Register, AcceptInvite
│   │   ├── Overview.vue         # Analytics dashboard
│   │   ├── Board.vue            # Global kanban board
│   │   ├── Projects.vue         # Project list
│   │   ├── ProjectDetail.vue    # Single project view
│   │   ├── Tasks.vue            # Task list with filters
│   │   ├── TaskDetail.vue       # Single task view with comments & activity
│   │   ├── Sprints.vue          # Sprint board + backlog + sprint list
│   │   ├── Notifications.vue    # Full notification history
│   │   ├── Members.vue          # Team management
│   │   └── Settings.vue         # Workspace settings
│   ├── stores/                  # Pinia state management
│   │   ├── authStore.ts         #   Authentication state & JWT
│   │   ├── dataStore.ts         #   Core data (projects, tasks, sprints, members)
│   │   ├── notificationStore.ts #   Notifications with 30s polling
│   │   ├── settingsStore.ts     #   Theme & UI preferences
│   │   └── toastStore.ts        #   Toast notifications
│   ├── types/index.ts           # TypeScript type definitions
│   └── router/index.ts          # Vue Router configuration
├── vercel.json                  # Vercel deployment config
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend, port 5173) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run type-check` | Run vue-tsc type checking |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `cd server && npm run dev` | Start Express dev server (backend, port 4000) |
| `cd server && npm test` | Run backend test suite (78 tests) |
| `cd server && npm run test:watch` | Run tests in watch mode |
| `cd server && npm run test:coverage` | Run tests with v8 coverage report |
| `cd server && npm run db:push` | Push Prisma schema to database |
| `cd server && npm run db:seed` | Seed database with demo data |
| `cd server && npm run db:studio` | Open Prisma Studio (database GUI) |

---

## Testing

The backend has a comprehensive test suite with **78 test cases** covering all route handlers:

| Module | Tests | Coverage |
|---|---|---|
| Auth | 11 | Register, login, /me with validation & error cases |
| Members | 13 | CRUD, invite flow, RBAC enforcement, owner protection |
| Tasks | 16 | CRUD, comments, activity log, notification triggers |
| Sprints | 14 | Lifecycle, single-active constraint, task rollover |
| Notifications | 13 | Pagination, filtering, read/delete with ownership checks |

Tests use **mocked Prisma client** — no database connection needed. Run with `cd server && npm test`.

---

## Deployment

The project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` (or `DATABASE_URL` / `DIRECT_DATABASE_URL`), `JWT_SECRET`
3. Vercel auto-runs `prisma generate` + `npm run build` via the configured `buildCommand`
4. API routes are served as a single serverless function via `api/index.ts`
5. Frontend SPA routing is handled by the rewrite rules in `vercel.json`

---

## License

MIT
