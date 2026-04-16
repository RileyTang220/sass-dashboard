import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';
import type { WorkspaceRole } from '@prisma/client';

const router = Router();

// Helper: get current member's workspace id + membership
async function getCurrentMembership(userId: string) {
  return prisma.workspaceMember.findFirst({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=ffffff`;
}

// Serialize a workspace member to the frontend shape
function serializeMember(m: any) {
  return {
    id: m.id,
    name: m.user.name,
    email: m.user.email,
    avatar: avatarUrl(m.user.name),
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt.toISOString(),
    lastActiveAt: m.lastActiveAt.toISOString(),
  };
}

// GET /api/members
router.get('/', authMiddleware, async (req, res) => {
  try {
    const me = await getCurrentMembership(req.userId!);
    if (!me) { res.status(403).json({ message: 'Not in a workspace' }); return; }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: me.workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    res.json(members.map(serializeMember));
  } catch (error) {
    console.error('Members list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/members/:id/role
router.patch('/:id/role', authMiddleware, async (req, res) => {
  try {
    const me = await getCurrentMembership(req.userId!);
    if (!me) { res.status(403).json({ message: 'Not in a workspace' }); return; }
    if (!['Owner', 'Admin'].includes(me.role)) {
      res.status(403).json({ message: 'Only owners and admins can change roles' });
      return;
    }

    const { role } = req.body as { role: WorkspaceRole };
    const target = await prisma.workspaceMember.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!target || target.workspaceId !== me.workspaceId) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: req.params.id },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(serializeMember(updated));
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
