import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/workspace — get current user's workspace
router.get('/', authMiddleware, async (req, res) => {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: req.userId },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true, projects: true } },
          },
        },
      },
    });

    if (!membership) {
      res.status(404).json({ message: 'No workspace found' });
      return;
    }

    const ws = membership.workspace;
    res.json({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      plan: ws.plan,
      memberCount: ws._count.members,
      projectCount: ws._count.projects,
    });
  } catch (error) {
    console.error('Workspace error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
