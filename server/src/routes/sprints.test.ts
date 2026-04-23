import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, authHeader, mockMember, mockSprint, mockTask } from '../__tests__/helpers.js';
import sprintRoutes from './sprints.js';
import { prisma } from '../prisma.js';

const app = createTestApp('/api/sprints', sprintRoutes);
const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/sprints ─────────────────────────────────────

describe('GET /api/sprints', () => {
  it('should list sprints for workspace', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.sprint.findMany.mockResolvedValue([
      mockSprint({ tasks: [{ id: 't1', status: 'Done' }, { id: 't2', status: 'Backlog' }], _count: { tasks: 2 } }),
    ]);

    const res = await request(app)
      .get('/api/sprints')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('taskCount');
    expect(res.body[0]).toHaveProperty('completedTaskCount');
    expect(res.body[0].taskCount).toBe(2);
    expect(res.body[0].completedTaskCount).toBe(1);
  });

  it('should return 403 without workspace', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/sprints')
      .set(authHeader());

    expect(res.status).toBe(403);
  });
});

// ── GET /api/sprints/active ──────────────────────────────

describe('GET /api/sprints/active', () => {
  it('should return the active sprint', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.sprint.findFirst.mockResolvedValue(mockSprint({ status: 'Active', tasks: [] }));

    const res = await request(app)
      .get('/api/sprints/active')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Active');
  });

  it('should return null if no active sprint', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.sprint.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/sprints/active')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

// ── GET /api/sprints/:id ─────────────────────────────────

describe('GET /api/sprints/:id', () => {
  it('should return a sprint by ID', async () => {
    db.sprint.findUnique.mockResolvedValue(mockSprint({ tasks: [] }));

    const res = await request(app)
      .get('/api/sprints/sprint-1')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('sprint-1');
  });

  it('should return 404 if not found', async () => {
    db.sprint.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/sprints/nonexistent')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

// ── POST /api/sprints ────────────────────────────────────

describe('POST /api/sprints', () => {
  it('should create a sprint with Planning status', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.sprint.create.mockResolvedValue(mockSprint({ id: 'new-sprint', tasks: [] }));

    const res = await request(app)
      .post('/api/sprints')
      .set(authHeader())
      .send({ name: 'Sprint 1', goal: 'Ship v2' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('new-sprint');
    expect(db.sprint.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'Planning' }),
      })
    );
  });

  it('should return 400 if name is missing', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());

    const res = await request(app)
      .post('/api/sprints')
      .set(authHeader())
      .send({ goal: 'No name' });

    expect(res.status).toBe(400);
  });
});

// ── POST /api/sprints/:id/start ──────────────────────────

describe('POST /api/sprints/:id/start', () => {
  it('should start a sprint when no other is active', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.sprint.findFirst.mockResolvedValue(null); // no active sprint
    db.sprint.update.mockResolvedValue(mockSprint({ status: 'Active', startDate: new Date(), tasks: [] }));

    const res = await request(app)
      .post('/api/sprints/sprint-1/start')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Active');
  });

  it('should return 409 if another sprint is already active', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember());
    db.sprint.findFirst.mockResolvedValue(mockSprint({ id: 'other-sprint', status: 'Active' }));

    const res = await request(app)
      .post('/api/sprints/sprint-1/start')
      .set(authHeader());

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already active/i);
  });
});

// ── POST /api/sprints/:id/complete ───────────────────────

describe('POST /api/sprints/:id/complete', () => {
  it('should complete a sprint and move unfinished tasks to backlog', async () => {
    const unfinished = [mockTask({ id: 't1', status: 'Backlog' }), mockTask({ id: 't2', status: 'InProgress' })];
    db.task.findMany.mockResolvedValue(unfinished);
    db.task.updateMany.mockResolvedValue({ count: 2 });
    db.sprint.update.mockResolvedValue(mockSprint({
      status: 'Completed',
      endDate: new Date(),
      tasks: [{ id: 't3', status: 'Done' }],
    }));

    const res = await request(app)
      .post('/api/sprints/sprint-1/complete')
      .set(authHeader())
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Completed');
    expect(res.body.movedTaskCount).toBe(2);
    // Unfinished tasks should be moved to backlog (sprintId: null)
    expect(db.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { sprintId: null },
      })
    );
  });

  it('should move unfinished tasks to a specific sprint', async () => {
    db.task.findMany.mockResolvedValue([mockTask({ status: 'Backlog' })]);
    db.task.updateMany.mockResolvedValue({ count: 1 });
    db.sprint.update.mockResolvedValue(mockSprint({ status: 'Completed', tasks: [] }));

    const res = await request(app)
      .post('/api/sprints/sprint-1/complete')
      .set(authHeader())
      .send({ moveUnfinishedTo: 'sprint-2' });

    expect(res.status).toBe(200);
    expect(db.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { sprintId: 'sprint-2' },
      })
    );
  });
});

// ── POST /api/sprints/:id/tasks ──────────────────────────

describe('POST /api/sprints/:id/tasks', () => {
  it('should add tasks to a sprint', async () => {
    db.task.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .post('/api/sprints/sprint-1/tasks')
      .set(authHeader())
      .send({ taskIds: ['t1', 't2', 't3'] });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
  });

  it('should return 400 if taskIds is empty', async () => {
    const res = await request(app)
      .post('/api/sprints/sprint-1/tasks')
      .set(authHeader())
      .send({ taskIds: [] });

    expect(res.status).toBe(400);
  });

  it('should return 400 if taskIds is missing', async () => {
    const res = await request(app)
      .post('/api/sprints/sprint-1/tasks')
      .set(authHeader())
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── DELETE /api/sprints/:id/tasks ────────────────────────

describe('DELETE /api/sprints/:id/tasks', () => {
  it('should remove tasks from a sprint', async () => {
    db.task.updateMany.mockResolvedValue({ count: 2 });

    const res = await request(app)
      .delete('/api/sprints/sprint-1/tasks')
      .set(authHeader())
      .send({ taskIds: ['t1', 't2'] });

    expect(res.status).toBe(200);
    expect(db.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { sprintId: null },
      })
    );
  });
});

// ── DELETE /api/sprints/:id ──────────────────────────────

describe('DELETE /api/sprints/:id', () => {
  it('should delete a sprint and move tasks to backlog', async () => {
    db.task.updateMany.mockResolvedValue({ count: 5 });
    db.sprint.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/sprints/sprint-1')
      .set(authHeader());

    expect(res.status).toBe(204);
    expect(db.task.updateMany).toHaveBeenCalledWith({
      where: { sprintId: 'sprint-1' },
      data: { sprintId: null },
    });
    expect(db.sprint.delete).toHaveBeenCalledWith({ where: { id: 'sprint-1' } });
  });
});
