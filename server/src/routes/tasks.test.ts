import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, authHeader, mockMember, mockTask } from '../__tests__/helpers.js';
import taskRoutes from './tasks.js';
import { prisma } from '../prisma.js';

const app = createTestApp('/api/tasks', taskRoutes);
const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/tasks ───────────────────────────────────────

describe('GET /api/tasks', () => {
  it('should list tasks for workspace', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.findMany.mockResolvedValue([mockTask(), mockTask({ id: 'task-2', title: 'Task 2' })]);

    const res = await request(app)
      .get('/api/tasks')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('title');
    expect(res.body[0]).toHaveProperty('status');
    expect(res.body[0]).toHaveProperty('sprintId');
  });

  it('should filter by projectId', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.findMany.mockResolvedValue([mockTask()]);

    const res = await request(app)
      .get('/api/tasks?projectId=proj-1')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(db.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: 'proj-1' }),
      })
    );
  });

  it('should return 403 without workspace membership', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tasks')
      .set(authHeader());

    expect(res.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/tasks/:id ───────────────────────────────────

describe('GET /api/tasks/:id', () => {
  it('should return a task by ID', async () => {
    db.task.findUnique.mockResolvedValue(mockTask());

    const res = await request(app)
      .get('/api/tasks/task-1')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('task-1');
    expect(res.body.status).toBe('Backlog');
  });

  it('should return 404 if task not found', async () => {
    db.task.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/tasks/nonexistent')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

// ── POST /api/tasks ──────────────────────────────────────

describe('POST /api/tasks', () => {
  it('should create a task', async () => {
    const task = mockTask({ id: 'new-task' });
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.create.mockResolvedValue(task);
    db.taskActivity.create.mockResolvedValue({});
    // Notification mocks (for when assignee differs)
    db.notification.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader())
      .send({ title: 'New Task', projectId: 'proj-1' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new-task');
    expect(db.task.create).toHaveBeenCalledOnce();
    expect(db.taskActivity.create).toHaveBeenCalledOnce();
  });

  it('should return 400 if title is missing', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader())
      .send({ projectId: 'proj-1' });

    expect(res.status).toBe(400);
  });

  it('should return 400 if projectId is missing', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader())
      .send({ title: 'Task' });

    expect(res.status).toBe(400);
  });

  it('should create a task with all optional fields', async () => {
    const task = mockTask({ id: 'full-task', priority: 'High', type: 'Bug', status: 'InProgress', sprintId: 'sprint-1' });
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.create.mockResolvedValue(task);
    db.taskActivity.create.mockResolvedValue({});
    db.notification.create.mockResolvedValue({});

    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader())
      .send({
        title: 'Full Task',
        projectId: 'proj-1',
        assigneeId: 'member-1',
        priority: 'High',
        type: 'Bug',
        status: 'In Progress',
        sprintId: 'sprint-1',
        dueDate: '2026-06-01T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
  });
});

// ── PATCH /api/tasks/:id ─────────────────────────────────

describe('PATCH /api/tasks/:id', () => {
  it('should update task status', async () => {
    const existing = mockTask();
    const updated = mockTask({ status: 'InProgress' });
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.findUnique.mockResolvedValue(existing);
    db.task.update.mockResolvedValue(updated);
    db.taskActivity.create.mockResolvedValue({});
    // Notification service mock
    db.notification.create.mockResolvedValue({});

    const res = await request(app)
      .patch('/api/tasks/task-1')
      .set(authHeader())
      .send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(db.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: expect.objectContaining({ status: 'InProgress' }),
      })
    );
  });

  it('should update task assignee', async () => {
    const existing = mockTask();
    const updated = mockTask({ assigneeId: 'member-2' });
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.findUnique.mockResolvedValue(existing);
    db.task.update.mockResolvedValue(updated);
    db.taskActivity.create.mockResolvedValue({});
    db.notification.create.mockResolvedValue({});
    // Mock for notification: memberToUserId
    db.workspaceMember.findUnique.mockResolvedValue(mockMember({ userId: 'user-2' }));

    const res = await request(app)
      .patch('/api/tasks/task-1')
      .set(authHeader())
      .send({ assigneeId: 'member-2' });

    expect(res.status).toBe(200);
  });

  it('should update sprintId', async () => {
    const existing = mockTask();
    const updated = mockTask({ sprintId: 'sprint-1' });
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.findUnique.mockResolvedValue(existing);
    db.task.update.mockResolvedValue(updated);
    db.taskActivity.create.mockResolvedValue({});

    const res = await request(app)
      .patch('/api/tasks/task-1')
      .set(authHeader())
      .send({ sprintId: 'sprint-1' });

    expect(res.status).toBe(200);
  });

  it('should return 404 if task not found', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.task.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/tasks/nonexistent')
      .set(authHeader())
      .send({ status: 'Done' });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/tasks/:id ────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  it('should delete a task', async () => {
    db.task.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/tasks/task-1')
      .set(authHeader());

    expect(res.status).toBe(204);
    expect(db.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
  });
});

// ── POST /api/tasks/:id/comments ─────────────────────────

describe('POST /api/tasks/:id/comments', () => {
  it('should add a comment to a task', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.taskComment.create.mockResolvedValue({
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'member-1',
      body: 'Great progress!',
      createdAt: new Date(),
      author: { user: { name: 'Test User', email: 'test@example.com' } },
    });
    db.taskActivity.create.mockResolvedValue({});
    db.task.findUnique.mockResolvedValue(mockTask());
    db.notification.create.mockResolvedValue({});
    db.workspaceMember.findUnique.mockResolvedValue(mockMember());

    const res = await request(app)
      .post('/api/tasks/task-1/comments')
      .set(authHeader())
      .send({ body: 'Great progress!' });

    expect(res.status).toBe(201);
    expect(res.body.body).toBe('Great progress!');
    expect(res.body.authorName).toBe('Test User');
  });

  it('should return 400 if body is missing', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());

    const res = await request(app)
      .post('/api/tasks/task-1/comments')
      .set(authHeader())
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── GET /api/tasks/:id/comments ──────────────────────────

describe('GET /api/tasks/:id/comments', () => {
  it('should return comments for a task', async () => {
    db.taskComment.findMany.mockResolvedValue([
      {
        id: 'c1',
        taskId: 'task-1',
        authorId: 'member-1',
        body: 'Hello',
        createdAt: new Date(),
        author: { user: { name: 'Test User', email: 'test@example.com' } },
      },
    ]);

    const res = await request(app)
      .get('/api/tasks/task-1/comments')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('authorName');
  });
});

// ── GET /api/tasks/:id/activity ──────────────────────────

describe('GET /api/tasks/:id/activity', () => {
  it('should return activity log for a task', async () => {
    db.taskActivity.findMany.mockResolvedValue([
      {
        id: 'a1',
        taskId: 'task-1',
        actorId: 'member-1',
        message: 'Created task',
        createdAt: new Date(),
        actor: { user: { name: 'Test User', email: 'test@example.com' } },
      },
    ]);

    const res = await request(app)
      .get('/api/tasks/task-1/activity')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('actorName');
  });
});
