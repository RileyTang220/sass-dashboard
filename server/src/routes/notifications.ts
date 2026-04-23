import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function serializeNotification(n: any) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    linkUrl: n.linkUrl,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

// GET /api/notifications — List notifications (paginated, newest first)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const filter = req.query.filter as string; // 'unread' or undefined for all

    const where: any = { userId: req.userId! };
    if (filter === 'unread') where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      notifications: notifications.map(serializeNotification),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId!, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read — Mark single notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification || notification.userId !== req.userId!) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json(serializeNotification(updated));
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/notifications/read-all — Mark all notifications as read
router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.userId!, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read', count: result.count });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });
    if (!notification || notification.userId !== req.userId!) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    await prisma.notification.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
