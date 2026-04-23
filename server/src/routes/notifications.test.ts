import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, authHeader, mockNotification } from '../__tests__/helpers.js';
import notificationRoutes from './notifications.js';
import { prisma } from '../prisma.js';

const app = createTestApp('/api/notifications', notificationRoutes);
const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/notifications ───────────────────────────────

describe('GET /api/notifications', () => {
  it('should return paginated notifications', async () => {
    const notifications = [mockNotification(), mockNotification({ id: 'notif-2' })];
    db.notification.findMany.mockResolvedValue(notifications);
    db.notification.count.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/notifications')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body).toHaveProperty('total', 2);
    expect(res.body).toHaveProperty('page', 1);
    expect(res.body).toHaveProperty('totalPages', 1);
  });

  it('should filter by unread', async () => {
    db.notification.findMany.mockResolvedValue([mockNotification()]);
    db.notification.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/notifications?filter=unread')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isRead: false }),
      })
    );
  });

  it('should support pagination params', async () => {
    db.notification.findMany.mockResolvedValue([]);
    db.notification.count.mockResolvedValue(100);

    const res = await request(app)
      .get('/api/notifications?page=3&limit=10')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(3);
    expect(res.body.limit).toBe(10);
    expect(res.body.totalPages).toBe(10);
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20, // (3-1) * 10
        take: 10,
      })
    );
  });

  it('should clamp limit to max 50', async () => {
    db.notification.findMany.mockResolvedValue([]);
    db.notification.count.mockResolvedValue(0);

    await request(app)
      .get('/api/notifications?limit=999')
      .set(authHeader());

    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/notifications/unread-count ──────────────────

describe('GET /api/notifications/unread-count', () => {
  it('should return unread count', async () => {
    db.notification.count.mockResolvedValue(5);

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(5);
    expect(db.notification.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ isRead: false }),
    });
  });
});

// ── PATCH /api/notifications/:id/read ────────────────────

describe('PATCH /api/notifications/:id/read', () => {
  it('should mark a notification as read', async () => {
    const notif = mockNotification({ userId: 'test-user-id' });
    db.notification.findUnique.mockResolvedValue(notif);
    db.notification.update.mockResolvedValue({ ...notif, isRead: true });

    const res = await request(app)
      .patch('/api/notifications/notif-1/read')
      .set(authHeader('test-user-id'));

    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it('should return 404 if notification not found', async () => {
    db.notification.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/notifications/nonexistent/read')
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('should return 404 if notification belongs to another user', async () => {
    db.notification.findUnique.mockResolvedValue(mockNotification({ userId: 'other-user' }));

    const res = await request(app)
      .patch('/api/notifications/notif-1/read')
      .set(authHeader('test-user-id'));

    expect(res.status).toBe(404);
  });
});

// ── POST /api/notifications/read-all ─────────────────────

describe('POST /api/notifications/read-all', () => {
  it('should mark all notifications as read', async () => {
    db.notification.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .post('/api/notifications/read-all')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ isRead: false }),
      data: { isRead: true },
    });
  });
});

// ── DELETE /api/notifications/:id ────────────────────────

describe('DELETE /api/notifications/:id', () => {
  it('should delete a notification', async () => {
    db.notification.findUnique.mockResolvedValue(mockNotification({ userId: 'test-user-id' }));
    db.notification.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/notifications/notif-1')
      .set(authHeader('test-user-id'));

    expect(res.status).toBe(204);
    expect(db.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
  });

  it('should return 404 if notification not found', async () => {
    db.notification.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/notifications/nonexistent')
      .set(authHeader());

    expect(res.status).toBe(404);
  });

  it('should return 404 if notification belongs to another user', async () => {
    db.notification.findUnique.mockResolvedValue(mockNotification({ userId: 'other-user' }));

    const res = await request(app)
      .delete('/api/notifications/notif-1')
      .set(authHeader('test-user-id'));

    expect(res.status).toBe(404);
  });
});
