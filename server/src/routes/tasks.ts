import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { TaskStatus, TaskPriority, TaskType } from '@prisma/client';

const router = Router();

async function getMemberId(userId: string) {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.id ?? null;
}

async function getWorkspaceId(userId: string) {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.workspaceId ?? null;
}

// Map Prisma enum to frontend string
function mapStatus(s: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    Backlog: 'Backlog',
    InProgress: 'In Progress',
    InReview: 'In Review',
    Done: 'Done',
  };
  return map[s] ?? s;
}

// Map frontend string to Prisma enum
function toStatusEnum(s: string): TaskStatus {
  const map: Record<string, TaskStatus> = {
    'Backlog': 'Backlog',
    'In Progress': 'InProgress',
    'In Review': 'InReview',
    'Done': 'Done',
  };
  return map[s] ?? 'Backlog';
}

function serializeTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    projectId: t.projectId,
    sprintId: t.sprintId ?? null,
    assigneeId: t.assigneeId,
    reporterId: t.reporterId,
    status: mapStatus(t.status),
    priority: t.priority,
    type: t.type,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// GET /api/tasks?projectId=xxx
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wsId = await getWorkspaceId(req.userId!);
    if (!wsId) { res.status(403).json({ message: 'No workspace' }); return; }

    const where: any = {
      project: { workspaceId: wsId },
    };
    if (req.query.projectId) {
      where.projectId = req.query.projectId as string;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks.map(serializeTask));
  } catch (error) {
    console.error('Tasks list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json(serializeTask(task));
  } catch (error) {
    console.error('Task get error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', authMiddleware, async (req, res) => {
  try {
    const memberId = await getMemberId(req.userId!);
    if (!memberId) { res.status(403).json({ message: 'No membership' }); return; }

    const { title, description, projectId, sprintId, assigneeId, priority, type, dueDate, status } = req.body;
    if (!title || !projectId) {
      res.status(400).json({ message: 'title and projectId are required' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? '',
        projectId,
        sprintId: sprintId ?? null,
        assigneeId: assigneeId || memberId,
        reporterId: memberId,
        status: status ? toStatusEnum(status) : 'Backlog',
        priority: (priority as TaskPriority) ?? 'Medium',
        type: (type as TaskType) ?? 'Feature',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Add creation activity
    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        actorId: memberId,
        message: 'Created task',
      },
    });

    res.status(201).json(serializeTask(task));
  } catch (error) {
    console.error('Task create error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const memberId = await getMemberId(req.userId!);
    if (!memberId) { res.status(403).json({ message: 'No membership' }); return; }

    const data: any = {};
    const activities: string[] = [];

    if (req.body.status !== undefined) {
      data.status = toStatusEnum(req.body.status);
      activities.push(`Changed status to ${req.body.status}`);
    }
    if (req.body.assigneeId !== undefined) {
      data.assigneeId = req.body.assigneeId;
      activities.push('Updated assignee');
    }
    if (req.body.projectId !== undefined) {
      data.projectId = req.body.projectId;
      activities.push('Moved task to another project');
    }
    if (req.body.description !== undefined) {
      data.description = req.body.description;
      activities.push('Updated task description');
    }
    if (req.body.priority !== undefined) {
      data.priority = req.body.priority;
      activities.push(`Changed priority to ${req.body.priority}`);
    }
    if (req.body.title !== undefined) {
      data.title = req.body.title;
    }
    if (req.body.dueDate !== undefined) {
      data.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.sprintId !== undefined) {
      data.sprintId = req.body.sprintId;
      activities.push(req.body.sprintId ? 'Added to sprint' : 'Removed from sprint');
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
    });

    // Record activities
    for (const message of activities) {
      await prisma.taskActivity.create({
        data: { taskId: task.id, actorId: memberId, message },
      });
    }

    res.json(serializeTask(task));
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Task delete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── Task Comments ──────────────────────────────────────

// GET /api/tasks/:id/comments
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.id },
      include: {
        author: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments.map(c => ({
      id: c.id,
      taskId: c.taskId,
      authorId: c.authorId,
      authorName: c.author.user.name,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Comments list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const memberId = await getMemberId(req.userId!);
    if (!memberId) { res.status(403).json({ message: 'No membership' }); return; }

    const { body } = req.body;
    if (!body) { res.status(400).json({ message: 'body is required' }); return; }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: req.params.id,
        authorId: memberId,
        body,
      },
      include: {
        author: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    // Activity log
    await prisma.taskActivity.create({
      data: {
        taskId: req.params.id,
        actorId: memberId,
        message: 'Added a comment',
      },
    });

    res.status(201).json({
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      authorName: comment.author.user.name,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Comment create error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ── Task Activity ──────────────────────────────────────

// GET /api/tasks/:id/activity
router.get('/:id/activity', authMiddleware, async (req, res) => {
  try {
    const activities = await prisma.taskActivity.findMany({
      where: { taskId: req.params.id },
      include: {
        actor: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(activities.map(a => ({
      id: a.id,
      taskId: a.taskId,
      actorId: a.actorId,
      actorName: a.actor.user.name,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error('Activity list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
