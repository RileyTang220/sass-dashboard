import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

async function getWorkspaceId(userId: string): Promise<string | null> {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.workspaceId ?? null;
}

async function getMemberId(userId: string): Promise<string | null> {
  const m = await prisma.workspaceMember.findFirst({ where: { userId } });
  return m?.id ?? null;
}

function serializeProject(p: any) {
  return {
    id: p.id,
    name: p.name,
    key: p.key,
    description: p.description,
    status: p.status.replace(/([A-Z])/g, ' $1').trim(), // OnTrack -> On Track
    progress: p.progress,
    ownerId: p.ownerId,
    memberIds: p.members?.map((pm: any) => pm.memberId) ?? [],
    dueDate: p.dueDate?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

const projectInclude = {
  members: { select: { memberId: true } },
};

// GET /api/projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const wsId = await getWorkspaceId(req.userId!);
    if (!wsId) { res.status(403).json({ message: 'No workspace' }); return; }

    const projects = await prisma.project.findMany({
      where: { workspaceId: wsId },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });

    res.json(projects.map(serializeProject));
  } catch (error) {
    console.error('Projects list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: projectInclude,
    });
    if (!project) { res.status(404).json({ message: 'Project not found' }); return; }
    res.json(serializeProject(project));
  } catch (error) {
    console.error('Project get error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/projects
router.post('/', authMiddleware, async (req, res) => {
  try {
    const wsId = await getWorkspaceId(req.userId!);
    const memberId = await getMemberId(req.userId!);
    if (!wsId || !memberId) { res.status(403).json({ message: 'No workspace' }); return; }

    const { name, key, description, ownerId, dueDate, memberIds } = req.body;
    if (!name || !key) {
      res.status(400).json({ message: 'name and key are required' });
      return;
    }

    const effectiveOwnerId = ownerId || memberId;
    const effectiveMembers = (memberIds && memberIds.length > 0) ? memberIds : [effectiveOwnerId];

    const project = await prisma.project.create({
      data: {
        workspaceId: wsId,
        name,
        key: key.toUpperCase(),
        description: description ?? '',
        ownerId: effectiveOwnerId,
        dueDate: dueDate ? new Date(dueDate) : null,
        members: {
          create: effectiveMembers.map((mid: string) => ({ memberId: mid })),
        },
      },
      include: projectInclude,
    });

    res.status(201).json(serializeProject(project));
  } catch (error) {
    console.error('Project create error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Project delete error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
