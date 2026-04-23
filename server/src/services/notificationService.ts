import { prisma } from '../prisma.js';
import type { NotificationType } from '@prisma/client';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
}

/**
 * Create a single notification for a user.
 * Silently catches errors so it never breaks the main request flow.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Create notifications for multiple users at once (e.g. all project members).
 */
export async function createNotificationsForUsers(
  userIds: string[],
  data: Omit<CreateNotificationInput, 'userId'>
) {
  try {
    // Deduplicate
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return;

    await prisma.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        linkUrl: data.linkUrl ?? null,
      })),
    });
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
  }
}

/**
 * Resolve a WorkspaceMember ID → User ID.
 */
export async function memberToUserId(memberId: string): Promise<string | null> {
  const m = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    select: { userId: true },
  });
  return m?.userId ?? null;
}

/**
 * Get display name for a member (used in notification messages).
 */
export async function getMemberName(memberId: string): Promise<string> {
  const m = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
    include: { user: { select: { name: true } } },
  });
  return m?.user.name ?? 'Someone';
}
