import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { SprintStatus } from '@prisma/client';

const router = Router();

async function getWorkspaceId(userId: string): Promise<string | null> {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.workspaceId ?? null;
}

function serializeSprint(s: any) {
  return {
    id: s.id,
    workspaceId: s.workspaceId,
    name: s.name,
    goal: s.goal,
    status: s.status,
    startDate: s.startDate?.toISOString() ?? null,
    endDate: s.endDate?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    taskCount: s._count?.tasks ?? s.tasks?.length ?? 0,
    completedTaskCount: s.tasks?.filter((t: any) => t.status === 'Done').length ?? 0,
  };
}

// GET /api/sprints
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wsId = await getWorkspaceId(req.userId!);
    if (!wsId) { res.status(403).json({ message: 'No workspace' }); return; }

    const sprints = await prisma.sprint.findMany({
      where: { workspaceId: wsId },
      include: {
        tasks: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sprints.map(serializeSprint));
  } catch (error) {
    console.error('Sprints list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/sprints/active — Get the currently active sprint with full task data
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const wsId = await getWorkspaceId(req.userId!);
    if (!wsId) { res.status(403).json({ message: 'No workspace' }); return; }

    const sprint = await prisma.sprint.findFirst({
      where: { workspaceId: wsId, status: 'Active' },
      include: {
        tasks: { select: { id: true, status: true } },
      },
    });

    if (!sprint) {
      res.json(null);
      return;
    }

    res.json(serializeSprint(sprint));
  } catch (error) {
    console.error('Active sprint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/sprints/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id },
      include: {
        tasks: { select: { id: true, status: true } },
      },
    });
    if (!sprint) { res.status(404).json({ message: 'Sprint not found' }); return; }
    res.json(serializeSprint(sprint));
  } catch (error) {
    console.error('Sprint get error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/sprints
router.post('/', authMiddleware, async (req, res) => {
  try {
    const wsId = await getWorkspaceId(req.userId!);
    if (!wsId) { res.status(403).json({ message: 'No workspace' }); return; }

    const { name, goal, startDate, endDate } = req.body;
    if (!name) {
      res.status(400).json({ message: 'name is required' });
      return;
    }

    const sprint = await prisma.sprint.create({
      data: {
        workspaceId: wsId,
        name,
        goal: goal ?? '',
        status: 'Planning',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        tasks: { select: { id: true, status: true } },
      },
    });

    res.status(201).json(serializeSprint(sprint));
  } catch (error) {
    console.error('Sprint create error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/sprints/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.goal !== undefined) data.goal = req.body.goal;
    if (req.body.startDate !== undefined) data.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    if (req.body.endDate !== undefined) data.endDate = req.body.endDate ? new Date(req.body.endDate) : null;

    const sprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data,
      include: {
        tasks: { select: { id: true, status: true } },
      },
    });

    res.json(serializeSprint(sprint));
  } catch (error) {
    console.error('Sprint update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/sprints/:id/start — Start a sprint (Planning → Active)
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const wsId = await getWorkspaceId(req.userId!);
    if (!wsId) { res.status(403).json({ message: 'No workspace' }); return; }

    // Check no other active sprint
    const activeSprint = await prisma.sprint.findFirst({
      where: { workspaceId: wsId, status: 'Active' },
    });
    if (activeSprint) {
      res.status(409).json({ message: 'Another sprint is already active. Complete it first.' });
      return;
    }

    const sprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data: {
        status: 'Active',
        startDate: new Date(),
      },
      include: {
        tasks: { select: { id: true, status: true } },
      },
    });

    res.json(serializeSprint(sprint));
  } catch (error) {
    console.error('Sprint start error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/sprints/:id/complete — Complete a sprint (Active → Completed)
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { moveUnfinishedTo } = req.body as { moveUnfinishedTo?: string | null };

    // Move unfinished tasks: either to another sprint or back to backlog (sprintId = null)
    const unfinishedTasks = await prisma.task.findMany({
      where: { sprintId: req.params.id, status: { not: 'Done' } },
    });

    if (unfinishedTasks.length > 0) {
      await prisma.task.updateMany({
        where: { sprintId: req.params.id, status: { not: 'Done' } },
        data: { sprintId: moveUnfinishedTo ?? null },
      });
    }

    const sprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data: {
        status: 'Completed',
        endDate: new Date(),
      },
      include: {
        tasks: { select: { id: true, status: true } },
      },
    });

    res.json({
      ...serializeSprint(sprint),
      movedTaskCount: unfinishedTasks.length,
    });
  } catch (error) {
    console.error('Sprint complete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/sprints/:id/tasks — Add tasks to sprint
router.post('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const { taskIds } = req.body as { taskIds: string[] };
    if (!taskIds || taskIds.length === 0) {
      res.status(400).json({ message: 'taskIds is required' });
      return;
    }

    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { sprintId: req.params.id },
    });

    res.json({ message: 'Tasks added to sprint', count: taskIds.length });
  } catch (error) {
    console.error('Add tasks to sprint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/sprints/:id/tasks — Remove tasks from sprint (back to backlog)
router.delete('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const { taskIds } = req.body as { taskIds: string[] };
    if (!taskIds || taskIds.length === 0) {
      res.status(400).json({ message: 'taskIds is required' });
      return;
    }

    await prisma.task.updateMany({
      where: { id: { in: taskIds }, sprintId: req.params.id },
      data: { sprintId: null },
    });

    res.json({ message: 'Tasks removed from sprint', count: taskIds.length });
  } catch (error) {
    console.error('Remove tasks from sprint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/sprints/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Move all tasks back to backlog before deleting
    await prisma.task.updateMany({
      where: { sprintId: req.params.id },
      data: { sprintId: null },
    });

    await prisma.sprint.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Sprint delete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
