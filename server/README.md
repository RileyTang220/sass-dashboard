# SaaS Dashboard — Server

Express + Prisma + PostgreSQL backend.

## Quick Start

### 1. Start PostgreSQL

```bash
# Option A: Docker (recommended)
cd server
docker compose up -d

# Option B: Use your local PostgreSQL and create the database
createdb saas_dashboard
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if your PostgreSQL credentials differ
```

### 3. Install dependencies

```bash
cd server
npm install
```

### 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed the database

```bash
npm run db:seed
```

### 6. Start the server

```bash
npm run dev
```

Server runs at `http://localhost:4000`.

## Seed Accounts

All seed users use password: `password123`

| Name         | Email                  | Role   |
|-------------|------------------------|--------|
| Alex Morgan  | alex@northstar.dev     | Owner  |
| Priya Shah   | priya@northstar.dev    | Admin  |
| Jordan Lee   | jordan@northstar.dev   | Member |
| Emma Carter  | emma@northstar.dev     | Member |
| Noah Kim     | noah@northstar.dev     | Guest  |

## API Endpoints

| Method | Path                        | Auth | Description              |
|--------|----------------------------|------|--------------------------|
| POST   | /api/auth/register         | No   | Register new user        |
| POST   | /api/auth/login            | No   | Login                    |
| GET    | /api/auth/me               | Yes  | Current user profile     |
| GET    | /api/workspace             | Yes  | Get workspace            |
| GET    | /api/members               | Yes  | List members             |
| PATCH  | /api/members/:id/role      | Yes  | Update member role       |
| GET    | /api/projects              | Yes  | List projects            |
| GET    | /api/projects/:id          | Yes  | Get project              |
| POST   | /api/projects              | Yes  | Create project           |
| DELETE | /api/projects/:id          | Yes  | Delete project           |
| GET    | /api/tasks                 | Yes  | List tasks               |
| GET    | /api/tasks/:id             | Yes  | Get task                 |
| POST   | /api/tasks                 | Yes  | Create task              |
| PATCH  | /api/tasks/:id             | Yes  | Update task              |
| DELETE | /api/tasks/:id             | Yes  | Delete task              |
| GET    | /api/tasks/:id/comments    | Yes  | List task comments       |
| POST   | /api/tasks/:id/comments    | Yes  | Add comment              |
| GET    | /api/tasks/:id/activity    | Yes  | List task activity       |

## Useful Commands

```bash
npm run dev          # Start dev server with hot reload
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:seed      # Re-seed database
```
