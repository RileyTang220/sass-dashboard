import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';
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

// POST /api/members — Direct add: create user account + workspace member
router.post('/', authMiddleware, async (req, res) => {
  try {
    const me = await getCurrentMembership(req.userId!);
    if (!me) { res.status(403).json({ message: 'Not in a workspace' }); return; }
    if (!['Owner', 'Admin'].includes(me.role)) {
      res.status(403).json({ message: 'Only owners and admins can add members' });
      return;
    }

    const { name, email, password, role, projectIds } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: WorkspaceRole;
      projectIds?: string[];
    };

    if (!name || !email || !password) {
      res.status(400).json({ message: 'name, email and password are required' });
      return;
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Check if already a member of this workspace
      const existing = await prisma.workspaceMember.findFirst({
        where: { workspaceId: me.workspaceId, userId: user.id },
      });
      if (existing) {
        res.status(409).json({ message: 'User is already a member of this workspace' });
        return;
      }
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: { name, email, passwordHash },
      });
    }

    // Create workspace membership
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: me.workspaceId,
        userId: user.id,
        role: role ?? 'Member',
        status: 'Active',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Assign to projects if specified
    if (projectIds && projectIds.length > 0) {
      await prisma.projectMember.createMany({
        data: projectIds.map((projectId: string) => ({
          projectId,
          memberId: member.id,
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json(serializeMember(member));
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/members/invite — Generate invite link
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const me = await getCurrentMembership(req.userId!);
    if (!me) { res.status(403).json({ message: 'Not in a workspace' }); return; }
    if (!['Owner', 'Admin'].includes(me.role)) {
      res.status(403).json({ message: 'Only owners and admins can invite members' });
      return;
    }

    const { email, role } = req.body as { email: string; role?: WorkspaceRole };
    if (!email) {
      res.status(400).json({ message: 'email is required' });
      return;
    }

    // Check if user exists and is already an active member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existing = await prisma.workspaceMember.findFirst({
        where: { workspaceId: me.workspaceId, userId: existingUser.id },
      });
      if (existing && existing.status === 'Active') {
        res.status(409).json({ message: 'User is already an active member of this workspace' });
        return;
      }
    }

    // Create a placeholder user if doesn't exist (will be updated on accept)
    const placeholderUser = existingUser ?? await prisma.user.create({
      data: {
        name: email.split('@')[0],
        email,
        passwordHash: '', // will be set when invite is accepted
      },
    });

    const inviteToken = uuidv4();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Upsert: if there's already an Invited membership, update the token
    const member = await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: me.workspaceId,
          userId: placeholderUser.id,
        },
      },
      update: {
        inviteToken,
        inviteExpiresAt,
        role: role ?? 'Member',
        status: 'Invited',
      },
      create: {
        workspaceId: me.workspaceId,
        userId: placeholderUser.id,
        role: role ?? 'Member',
        status: 'Invited',
        inviteToken,
        inviteExpiresAt,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({
      ...serializeMember(member),
      inviteToken,
      inviteLink: `/invite/${inviteToken}`,
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/members/invite/:token — Get invite info (no auth needed)
router.get('/invite/:token', async (req, res) => {
  try {
    const member = await prisma.workspaceMember.findUnique({
      where: { inviteToken: req.params.token },
      include: {
        workspace: { select: { name: true } },
        user: { select: { email: true } },
      },
    });

    if (!member) {
      res.status(404).json({ message: 'Invite not found or already used' });
      return;
    }

    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      res.status(410).json({ message: 'Invite has expired' });
      return;
    }

    res.json({
      email: member.user.email,
      workspaceName: member.workspace.name,
      role: member.role,
    });
  } catch (error) {
    console.error('Invite info error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/members/invite/:token/accept — Accept invite (no auth needed)
router.post('/invite/:token/accept', async (req, res) => {
  try {
    const { name, password } = req.body as { name: string; password: string };
    if (!name || !password) {
      res.status(400).json({ message: 'name and password are required' });
      return;
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { inviteToken: req.params.token },
      include: { user: true },
    });

    if (!member) {
      res.status(404).json({ message: 'Invite not found or already used' });
      return;
    }

    if (member.status === 'Active') {
      res.status(409).json({ message: 'Invite has already been accepted' });
      return;
    }

    if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
      res.status(410).json({ message: 'Invite has expired' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Update user profile and password
    await prisma.user.update({
      where: { id: member.userId },
      data: { name, passwordHash },
    });

    // Activate membership and clear invite token
    await prisma.workspaceMember.update({
      where: { id: member.id },
      data: {
        status: 'Active',
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    res.json({ message: 'Invite accepted. You can now log in.' });
  } catch (error) {
    console.error('Accept invite error:', error);
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

// DELETE /api/members/:id — Remove member from workspace
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const me = await getCurrentMembership(req.userId!);
    if (!me) { res.status(403).json({ message: 'Not in a workspace' }); return; }
    if (!['Owner', 'Admin'].includes(me.role)) {
      res.status(403).json({ message: 'Only owners and admins can remove members' });
      return;
    }

    const target = await prisma.workspaceMember.findUnique({
      where: { id: req.params.id },
    });
    if (!target || target.workspaceId !== me.workspaceId) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    if (target.role === 'Owner') {
      res.status(403).json({ message: 'Cannot remove workspace owner' });
      return;
    }

    await prisma.projectMember.deleteMany({ where: { memberId: target.id } });
    await prisma.workspaceMember.delete({ where: { id: target.id } });

    res.status(204).end();
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
