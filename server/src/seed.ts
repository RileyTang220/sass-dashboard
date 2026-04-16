/**
 * Seed script — populates the database with the same data as the frontend mockData.
 * Run: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.taskActivity.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Alex Morgan', email: 'alex@northstar.dev', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { name: 'Priya Shah', email: 'priya@northstar.dev', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { name: 'Jordan Lee', email: 'jordan@northstar.dev', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { name: 'Emma Carter', email: 'emma@northstar.dev', passwordHash: hash('password123') } }),
    prisma.user.create({ data: { name: 'Noah Kim', email: 'noah@northstar.dev', passwordHash: hash('password123') } }),
  ]);
  const [alex, priya, jordan, emma, noah] = users;

  // ── Workspace ─────────────────────────────────────
  const workspace = await prisma.workspace.create({
    data: { name: 'Northstar Team Workspace', slug: 'northstar', plan: 'Team' },
  });

  // ── Workspace Members ─────────────────────────────
  const members = await Promise.all([
    prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: alex.id, role: 'Owner', status: 'Active', joinedAt: daysAgo(240), lastActiveAt: daysAgo(0) } }),
    prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: priya.id, role: 'Admin', status: 'Active', joinedAt: daysAgo(190), lastActiveAt: daysAgo(1) } }),
    prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: jordan.id, role: 'Member', status: 'Active', joinedAt: daysAgo(120), lastActiveAt: daysAgo(0) } }),
    prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: emma.id, role: 'Member', status: 'Active', joinedAt: daysAgo(75), lastActiveAt: daysAgo(2) } }),
    prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: noah.id, role: 'Guest', status: 'Active', joinedAt: daysAgo(12), lastActiveAt: daysAgo(4) } }),
  ]);
  const [mAlex, mPriya, mJordan, mEmma, mNoah] = members;

  // ── Projects ──────────────────────────────────────
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: 'Platform Migration',
        key: 'PLAT',
        description: 'Move internal admin workflows into the new shared workspace.',
        status: 'OnTrack',
        progress: 68,
        ownerId: mPriya.id,
        dueDate: daysFromNow(18),
      },
    }),
    prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: 'Customer Portal',
        key: 'PORT',
        description: 'Ship the first self-serve project and task portal for clients.',
        status: 'AtRisk',
        progress: 42,
        ownerId: mJordan.id,
        dueDate: daysFromNow(9),
      },
    }),
    prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: 'Support Ops',
        key: 'OPS',
        description: 'Standardize request handling, SLAs, and weekly reporting.',
        status: 'Completed',
        progress: 100,
        ownerId: mAlex.id,
        dueDate: daysAgo(6),
      },
    }),
  ]);
  const [platProject, portProject, opsProject] = projects;

  // ── Project Members ───────────────────────────────
  await Promise.all([
    // Platform Migration: Alex, Priya, Jordan
    prisma.projectMember.create({ data: { projectId: platProject.id, memberId: mAlex.id } }),
    prisma.projectMember.create({ data: { projectId: platProject.id, memberId: mPriya.id } }),
    prisma.projectMember.create({ data: { projectId: platProject.id, memberId: mJordan.id } }),
    // Customer Portal: Priya, Jordan, Emma
    prisma.projectMember.create({ data: { projectId: portProject.id, memberId: mPriya.id } }),
    prisma.projectMember.create({ data: { projectId: portProject.id, memberId: mJordan.id } }),
    prisma.projectMember.create({ data: { projectId: portProject.id, memberId: mEmma.id } }),
    // Support Ops: Alex, Emma
    prisma.projectMember.create({ data: { projectId: opsProject.id, memberId: mAlex.id } }),
    prisma.projectMember.create({ data: { projectId: opsProject.id, memberId: mEmma.id } }),
  ]);

  // ── Tasks ─────────────────────────────────────────
  const tasks = await Promise.all([
    prisma.task.create({ data: {
      projectId: platProject.id, title: 'Define project permissions matrix',
      description: 'Define project permissions matrix for the current delivery cycle.',
      assigneeId: mPriya.id, reporterId: mAlex.id,
      status: 'InProgress', priority: 'High', type: 'Ops',
      dueDate: daysFromNow(4), createdAt: daysAgo(10),
    }}),
    prisma.task.create({ data: {
      projectId: platProject.id, title: 'Refactor sidebar navigation',
      description: 'Refactor sidebar navigation for the current delivery cycle.',
      assigneeId: mJordan.id, reporterId: mPriya.id,
      status: 'InReview', priority: 'Medium', type: 'Feature',
      dueDate: daysFromNow(2), createdAt: daysAgo(7),
    }}),
    prisma.task.create({ data: {
      projectId: platProject.id, title: 'Audit stale integrations',
      description: 'Audit stale integrations for the current delivery cycle.',
      assigneeId: mAlex.id, reporterId: mPriya.id,
      status: 'Backlog', priority: 'Medium', type: 'Research',
      dueDate: daysFromNow(8), createdAt: daysAgo(3),
    }}),
    prisma.task.create({ data: {
      projectId: portProject.id, title: 'Create task creation flow',
      description: 'Create task creation flow for the current delivery cycle.',
      assigneeId: mEmma.id, reporterId: mJordan.id,
      status: 'InProgress', priority: 'Critical', type: 'Feature',
      dueDate: daysFromNow(5), createdAt: daysAgo(9),
    }}),
    prisma.task.create({ data: {
      projectId: portProject.id, title: 'Fix project member assignment edge case',
      description: 'Fix project member assignment edge case for the current delivery cycle.',
      assigneeId: mJordan.id, reporterId: mEmma.id,
      status: 'Backlog', priority: 'High', type: 'Bug',
      dueDate: daysFromNow(1), createdAt: daysAgo(2),
    }}),
    prisma.task.create({ data: {
      projectId: portProject.id, title: 'Document onboarding checklist',
      description: 'Document onboarding checklist for the current delivery cycle.',
      assigneeId: mNoah.id, reporterId: mPriya.id,
      status: 'Done', priority: 'Low', type: 'Ops',
      dueDate: daysAgo(1), createdAt: daysAgo(12),
    }}),
    prisma.task.create({ data: {
      projectId: opsProject.id, title: 'Backfill weekly support report',
      description: 'Backfill weekly support report for the current delivery cycle.',
      assigneeId: mEmma.id, reporterId: mAlex.id,
      status: 'Done', priority: 'Low', type: 'Ops',
      dueDate: daysAgo(8), createdAt: daysAgo(16),
    }}),
    prisma.task.create({ data: {
      projectId: opsProject.id, title: 'Review handoff notes',
      description: 'Review handoff notes for the current delivery cycle.',
      assigneeId: mPriya.id, reporterId: mAlex.id,
      status: 'Done', priority: 'Medium', type: 'Research',
      dueDate: daysAgo(3), createdAt: daysAgo(14),
    }}),
    prisma.task.create({ data: {
      projectId: portProject.id, title: 'Prepare stakeholder demo',
      description: 'Prepare stakeholder demo for the current delivery cycle.',
      assigneeId: mAlex.id, reporterId: mJordan.id,
      status: 'InReview', priority: 'High', type: 'Feature',
      dueDate: daysFromNow(3), createdAt: daysAgo(6),
    }}),
  ]);

  // ── Comments ──────────────────────────────────────
  await Promise.all([
    prisma.taskComment.create({ data: {
      taskId: tasks[3].id, authorId: mJordan.id,
      body: 'We should keep the creation flow lightweight in this phase.',
      createdAt: daysAgo(2),
    }}),
    prisma.taskComment.create({ data: {
      taskId: tasks[3].id, authorId: mEmma.id,
      body: 'I can take the modal validation pass after the detail page lands.',
      createdAt: daysAgo(1),
    }}),
    prisma.taskComment.create({ data: {
      taskId: tasks[1].id, authorId: mPriya.id,
      body: 'Navigation update looks good. Check empty workspace states before merge.',
      createdAt: daysAgo(0),
    }}),
  ]);

  // ── Activity ──────────────────────────────────────
  await Promise.all([
    prisma.taskActivity.create({ data: {
      taskId: tasks[3].id, actorId: mJordan.id,
      message: 'Moved task to In Progress', createdAt: daysAgo(0),
    }}),
    prisma.taskActivity.create({ data: {
      taskId: tasks[1].id, actorId: mPriya.id,
      message: 'Requested review from design systems owner', createdAt: daysAgo(0),
    }}),
    prisma.taskActivity.create({ data: {
      taskId: tasks[4].id, actorId: mEmma.id,
      message: 'Raised priority after assignment edge case reproduced', createdAt: daysAgo(1),
    }}),
    prisma.taskActivity.create({ data: {
      taskId: tasks[0].id, actorId: mAlex.id,
      message: 'Updated permissions notes and linked architecture draft', createdAt: daysAgo(2),
    }}),
  ]);

  console.log('Seed complete!');
  console.log(`  Users:    ${users.length}`);
  console.log(`  Members:  ${members.length}`);
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Tasks:    ${tasks.length}`);
  console.log('\nLogin with any user email + password "password123"');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
