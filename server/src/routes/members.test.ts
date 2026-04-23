import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, authHeader, mockMember, mockUser } from '../__tests__/helpers.js';
import memberRoutes from './members.js';
import { prisma } from '../prisma.js';

const app = createTestApp('/api/members', memberRoutes);
const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/members ─────────────────────────────────────

describe('GET /api/members', () => {
  it('should list workspace members', async () => {
    const me = mockMember({ role: 'Owner' });
    const members = [me, mockMember({ id: 'member-2', userId: 'user-2', user: { id: 'user-2', name: 'Other', email: 'other@test.com' } })];

    db.workspaceMember.findFirst.mockResolvedValue(me);
    db.workspaceMember.findMany.mockResolvedValue(members);

    const res = await request(app)
      .get('/api/members')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('role');
    expect(res.body[0]).toHaveProperty('email');
  });

  it('should return 403 if not in a workspace', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/members')
      .set(authHeader());

    expect(res.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/members');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/members (Direct Add) ──────────────────────

describe('POST /api/members', () => {
  it('should add a new member when called by Owner', async () => {
    const me = mockMember({ role: 'Owner' });
    db.workspaceMember.findFirst.mockResolvedValue(me);
    db.user.findUnique.mockResolvedValue(null); // new user
    db.user.create.mockResolvedValue(mockUser({ id: 'new-user' }));
    db.workspaceMember.create.mockResolvedValue(mockMember({
      id: 'new-member',
      userId: 'new-user',
      user: { id: 'new-user', name: 'New Person', email: 'new@test.com' },
    }));

    const res = await request(app)
      .post('/api/members')
      .set(authHeader())
      .send({ name: 'New Person', email: 'new@test.com', password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'New Person');
  });

  it('should return 403 if caller is a regular Member', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember({ role: 'Member' }));

    const res = await request(app)
      .post('/api/members')
      .set(authHeader())
      .send({ name: 'New', email: 'new@test.com', password: 'pass123' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only owners and admins/i);
  });

  it('should return 400 if required fields are missing', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember({ role: 'Owner' }));

    const res = await request(app)
      .post('/api/members')
      .set(authHeader())
      .send({ name: 'New' }); // missing email and password

    expect(res.status).toBe(400);
  });

  it('should return 409 if user is already a member', async () => {
    const me = mockMember({ role: 'Admin' });
    db.workspaceMember.findFirst
      .mockResolvedValueOnce(me) // getCurrentMembership
      .mockResolvedValueOnce(mockMember()); // existing member check

    db.user.findUnique.mockResolvedValue(mockUser());

    const res = await request(app)
      .post('/api/members')
      .set(authHeader())
      .send({ name: 'Existing', email: 'test@example.com', password: 'pass123' });

    expect(res.status).toBe(409);
  });
});

// ── POST /api/members/invite ─────────────────────────────

describe('POST /api/members/invite', () => {
  it('should generate an invite link', async () => {
    const me = mockMember({ role: 'Owner' });
    db.workspaceMember.findFirst.mockResolvedValue(me);
    db.user.findUnique.mockResolvedValue(null); // new email
    db.user.create.mockResolvedValue(mockUser({ id: 'placeholder-user' }));
    db.workspaceMember.upsert.mockResolvedValue(mockMember({
      id: 'invited-member',
      status: 'Invited',
      user: { id: 'placeholder-user', name: 'new', email: 'invite@test.com' },
    }));

    const res = await request(app)
      .post('/api/members/invite')
      .set(authHeader())
      .send({ email: 'invite@test.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('inviteToken');
    expect(res.body).toHaveProperty('inviteLink');
  });

  it('should return 403 for Guest role', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember({ role: 'Guest' }));

    const res = await request(app)
      .post('/api/members/invite')
      .set(authHeader())
      .send({ email: 'invite@test.com' });

    expect(res.status).toBe(403);
  });

  it('should return 400 if email is missing', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember({ role: 'Owner' }));

    const res = await request(app)
      .post('/api/members/invite')
      .set(authHeader())
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── PATCH /api/members/:id/role ──────────────────────────

describe('PATCH /api/members/:id/role', () => {
  it('should update member role', async () => {
    const me = mockMember({ role: 'Owner' });
    db.workspaceMember.findFirst.mockResolvedValue(me);
    db.workspaceMember.findUnique.mockResolvedValue(mockMember({ id: 'target-member', workspaceId: 'ws-1' }));
    db.workspaceMember.update.mockResolvedValue(mockMember({ id: 'target-member', role: 'Admin' }));

    const res = await request(app)
      .patch('/api/members/target-member/role')
      .set(authHeader())
      .send({ role: 'Admin' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('Admin');
  });

  it('should return 403 for non-admin caller', async () => {
    db.workspaceMember.findFirst.mockResolvedValue(mockMember({ role: 'Member' }));

    const res = await request(app)
      .patch('/api/members/target-member/role')
      .set(authHeader())
      .send({ role: 'Admin' });

    expect(res.status).toBe(403);
  });
});

// ── DELETE /api/members/:id ──────────────────────────────

describe('DELETE /api/members/:id', () => {
  it('should remove a member', async () => {
    const me = mockMember({ role: 'Owner' });
    db.workspaceMember.findFirst.mockResolvedValue(me);
    db.workspaceMember.findUnique.mockResolvedValue(mockMember({ id: 'target', role: 'Member', workspaceId: 'ws-1' }));
    db.projectMember.deleteMany.mockResolvedValue({ count: 0 });
    db.workspaceMember.delete.mockResolvedValue({});

    const res = await request(app)
      .delete('/api/members/target')
      .set(authHeader());

    expect(res.status).toBe(204);
    expect(db.projectMember.deleteMany).toHaveBeenCalledWith({ where: { memberId: 'target' } });
    expect(db.workspaceMember.delete).toHaveBeenCalledWith({ where: { id: 'target' } });
  });

  it('should not allow removing an Owner', async () => {
    const me = mockMember({ role: 'Owner' });
    db.workspaceMember.findFirst.mockResolvedValue(me);
    db.workspaceMember.findUnique.mockResolvedValue(mockMember({ id: 'owner-member', role: 'Owner', workspaceId: 'ws-1' }));

    const res = await request(app)
      .delete('/api/members/owner-member')
      .set(authHeader());

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot remove.*owner/i);
  });

  it('should return 404 if member not found', async () => {
    const me = mockMember({ role: 'Owner' });
    db.workspaceMember.findFirst.mockResolvedValue(me);
    db.workspaceMember.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/members/nonexistent')
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});
