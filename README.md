# TeamFlow — Project Management & Team Collaboration Platform

<p align="center">
  <strong>A modern, enterprise-grade project management platform built for agile teams.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel" alt="Vercel" />
</p>

---

## Overview

TeamFlow is a Jira-inspired project management platform designed for agile teams to plan, track, and deliver work efficiently. It provides a complete workflow from sprint planning to task execution, with real-time collaboration features and role-based access control.

**Live Demo:** [https://sass-dashboard-bay.vercel.app](https://sass-dashboard-bay.vercel.app)

---

## Features

### Sprint Management
Plan work in time-boxed iterations with a full sprint lifecycle — create sprints, populate them from the backlog, track progress on the sprint board, and complete sprints with automatic unfinished task rollover.

### Kanban Board
Visualize work in progress with a column-based board view. Tasks flow through Backlog, In Progress, In Review, and Done stages. Available both as a global board and a sprint-scoped board.

### Project & Task Tracking
Organize work into projects with unique keys. Each task carries a full set of metadata — priority, type, assignee, reporter, due date, status — with a complete activity timeline and comment thread.

### Team & Member Management
Manage workspace members with role-based access control (Owner, Admin, Member, Guest). Add members directly with credentials or generate time-limited invite links for self-service onboarding.

### Analytics Dashboard
Get a bird's-eye view of workspace health with key metrics — completion rate, task distribution by status, project progress, member workload, and 7-day activity trends.

### Authentication & Security
JWT-based authentication with bcrypt password hashing. Route guards protect authenticated pages, and role-based permissions control who can create projects, manage members, and modify tasks.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Vue 3 (Composition API) | UI framework |
| TypeScript | Type safety |
| Pinia | State management |
| Vue Router | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Heroicons | Icon system |
| date-fns | Date formatting |
| Vite | Build tool & dev server |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Prisma ORM | Database access & migrations |
| PostgreSQL (Neon) | Relational database |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |

### Infrastructure
| Technology | Purpose |
|---|---|
| Vercel | Frontend hosting & serverless functions |
| Vercel Postgres (Neon) | Managed database |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Vue 3 Frontend                     │
│  Pinia Stores ← API Client → Vue Router → Pages     │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (fetch)
┌──────────────────────▼──────────────────────────────┐
│              Express API Server                      │
│  Auth Middleware → Route Handlers → Prisma Client    │
└──────────────────────┬──────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────┐
│              PostgreSQL (Neon)                        │
│  Users · Workspaces · Members · Projects · Tasks     │
│  Sprints · Comments · Activities                     │
└─────────────────────────────────────────────────────┘
```

**Local Development:** Frontend (Vite, port 5173) + Backend (Express, port 4000)
**Production:** Vercel serves the static frontend and runs the API as a serverless function.

---

## Data Model

```
Workspace
 ├── WorkspaceMember (User ↔ Workspace, with role & status)
 ├── Project
 │    ├── ProjectMember (Member ↔ Project)
 │    └── Task
 │         ├── TaskComment
 │         └── TaskActivity
 └── Sprint
      └── Task (via sprintId)
```

**Key entities:** User, Workspace, WorkspaceMember, Project, Task, Sprint, TaskComment, TaskActivity

**Enums:** WorkspaceRole (Owner/Admin/Member/Guest), SprintStatus (Planning/Active/Completed), TaskStatus (Backlog/In Progress/In Review/Done), TaskPriority (Low/Medium/High/Critical), TaskType (Feature/Bug/Ops/Research)

---

## Getting Started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- PostgreSQL database (local or cloud)

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

**Demo accounts** (after seeding): `alice@demo.com` / `password123`

### Production Build

```bash
npm run build
```


## Project Structure

```
├── api/
│   └── index.ts              # Vercel serverless entry point
├── server/
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── src/
│       ├── routes/            # Express route handlers
│       │   ├── auth.ts
│       │   ├── workspace.ts
│       │   ├── members.ts
│       │   ├── projects.ts
│       │   ├── tasks.ts
│       │   └── sprints.ts
│       ├── middleware/auth.ts # JWT auth middleware
│       ├── prisma.ts          # Prisma client singleton
│       ├── seed.ts            # Database seeder
│       └── index.ts           # Express app setup
├── src/
│   ├── api/client.ts          # Frontend API client
│   ├── components/
│   │   ├── common/            # Shared UI components
│   │   └── layout/            # Sidebar, Topbar, DefaultLayout
│   ├── pages/
│   │   ├── auth/              # Login, Register, AcceptInvite
│   │   ├── Overview.vue
│   │   ├── Board.vue
│   │   ├── Projects.vue
│   │   ├── ProjectDetail.vue
│   │   ├── Tasks.vue
│   │   ├── TaskDetail.vue
│   │   ├── Sprints.vue
│   │   ├── Members.vue
│   │   └── Settings.vue
│   ├── stores/                # Pinia state management
│   ├── types/index.ts         # TypeScript type definitions
│   └── router/index.ts        # Vue Router configuration
├── vercel.json                # Vercel deployment config
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run type-check` | Run vue-tsc type checking |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `cd server && npm run dev` | Start Express dev server (backend) |
| `cd server && npm run db:push` | Push Prisma schema to database |
| `cd server && npm run db:seed` | Seed database with demo data |
| `cd server && npm run db:studio` | Open Prisma Studio (database GUI) |

---

## License

MIT
