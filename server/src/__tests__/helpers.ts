import express from 'express';
import { signToken } from '../middleware/auth.js';

/**
 * Create a minimal Express app with JSON parsing for testing a router.
 */
export function createTestApp(path: string, router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use(path, router);
  return app;
}

/**
 * Generate a valid JWT token for testing authenticated routes.
 */
export function authHeader(userId = 'test-user-id') {
  const token = signToken(userId);
  return { Authorization: `Bearer ${token}` };
}

/**
 * Factory: create a mock user record.
 */
export function mockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory: create a mock workspace member record.
 */
export function mockMember(overrides: Record<string, any> = {}) {
  return {
    id: 'member-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    role: 'Member',
    status: 'Active',
    inviteToken: null,
    inviteExpiresAt: null,
    joinedAt: new Date(),
    lastActiveAt: new Date(),
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    ...overrides,
  };
}

/**
 * Factory: create a mock task record.
 */
export function mockTask(overrides: Record<string, any> = {}) {
  return {
    id: 'task-1',
    projectId: 'proj-1',
    sprintId: null,
    title: 'Test Task',
    description: 'A test task',
    assigneeId: 'member-1',
    reporterId: 'member-1',
    status: 'Backlog' as const,
    priority: 'Medium' as const,
    type: 'Feature' as const,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Factory: create a mock sprint record.
 */
export function mockSprint(overrides: Record<string, any> = {}) {
  return {
    id: 'sprint-1',
    workspaceId: 'ws-1',
    name: 'Sprint 1',
    goal: 'Ship features',
    status: 'Planning' as const,
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tasks: [],
    _count: { tasks: 0 },
    ...overrides,
  };
}

/**
 * Factory: create a mock notification record.
 */
export function mockNotification(overrides: Record<string, any> = {}) {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'TaskAssigned' as const,
    title: 'Task assigned',
    message: 'You have been assigned a task',
    linkUrl: '/tasks/task-1',
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}
