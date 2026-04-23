import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, authHeader, mockUser } from '../__tests__/helpers.js';
import authRoutes from './auth.js';
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';

const app = createTestApp('/api/auth', authRoutes);

// Type the mocked prisma
const db = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

// ── POST /api/auth/register ──────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a new user and return token', async () => {
    const newUser = mockUser({ id: 'new-user' });
    db.user.findUnique.mockResolvedValue(null); // no existing user
    db.user.create.mockResolvedValue(newUser);
    db.workspace.create.mockResolvedValue({ id: 'ws-1', name: "Test's Workspace", slug: 'test-workspace' });
    db.workspaceMember.create.mockResolvedValue({ id: 'member-1' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toEqual({ id: 'new-user', name: 'Test User', email: 'test@example.com' });
    expect(db.user.create).toHaveBeenCalledOnce();
    expect(db.workspace.create).toHaveBeenCalledOnce();
    expect(db.workspaceMember.create).toHaveBeenCalledOnce();
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name.*email.*password/i);
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com' });

    expect(res.status).toBe(400);
  });

  it('should return 409 if email is already registered', async () => {
    db.user.findUnique.mockResolvedValue(mockUser());

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

// ── POST /api/auth/login ─────────────────────────────────

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const hash = await bcrypt.hash('password123', 10);
    const user = mockUser({ passwordHash: hash });
    db.user.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });

  it('should return 401 if user not found', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('should return 401 if password is wrong', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    db.user.findUnique.mockResolvedValue(mockUser({ passwordHash: hash }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });
});

// ── GET /api/auth/me ─────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('should return current user profile', async () => {
    const user = { id: 'test-user-id', name: 'Test User', email: 'test@example.com' };
    db.user.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader('test-user-id'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: 'Bearer invalid-token' });

    expect(res.status).toBe(401);
  });

  it('should return 404 if user not found in DB', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/me')
      .set(authHeader('deleted-user'));

    expect(res.status).toBe(404);
  });
});
