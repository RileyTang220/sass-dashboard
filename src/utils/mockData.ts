import { addDays, subDays } from 'date-fns'
import type {
  Member,
  Project,
  ProjectStatus,
  TaskActivity,
  TaskComment,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
  Workspace,
  WorkspaceRole,
  WorkspaceSeed,
} from '@/types'

const createAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=ffffff`

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

export const createMockWorkspaceSeed = (): WorkspaceSeed => {
  const members: Member[] = [
    buildMember('m_1', 'Alex Morgan', 'alex@northstar.dev', 'Owner', 240, 0),
    buildMember('m_2', 'Priya Shah', 'priya@northstar.dev', 'Admin', 190, 1),
    buildMember('m_3', 'Jordan Lee', 'jordan@northstar.dev', 'Member', 120, 0),
    buildMember('m_4', 'Emma Carter', 'emma@northstar.dev', 'Member', 75, 2),
    buildMember('m_5', 'Noah Kim', 'noah@northstar.dev', 'Guest', 12, 4),
  ]

  const projects: Project[] = [
    buildProject({
      id: 'p_1',
      name: 'Platform Migration',
      key: 'PLAT',
      description: 'Move internal admin workflows into the new shared workspace.',
      status: 'On Track',
      progress: 68,
      ownerId: 'm_2',
      memberIds: ['m_1', 'm_2', 'm_3'],
      dueOffset: 18,
      updatedOffset: 1,
    }),
    buildProject({
      id: 'p_2',
      name: 'Customer Portal',
      key: 'PORT',
      description: 'Ship the first self-serve project and task portal for clients.',
      status: 'At Risk',
      progress: 42,
      ownerId: 'm_3',
      memberIds: ['m_2', 'm_3', 'm_4'],
      dueOffset: 9,
      updatedOffset: 0,
    }),
    buildProject({
      id: 'p_3',
      name: 'Support Ops',
      key: 'OPS',
      description: 'Standardize request handling, SLAs, and weekly reporting.',
      status: 'Completed',
      progress: 100,
      ownerId: 'm_1',
      memberIds: ['m_1', 'm_4'],
      dueOffset: -6,
      updatedOffset: 5,
    }),
  ]

  const tasks: Task[] = [
    buildTask('t_1', 'Define project permissions matrix', 'p_1', 'm_2', 'm_1', 'In Progress', 'High', 'Ops', 4, 10, 1),
    buildTask('t_2', 'Refactor sidebar navigation', 'p_1', 'm_3', 'm_2', 'In Review', 'Medium', 'Feature', 2, 7, 0),
    buildTask('t_3', 'Audit stale integrations', 'p_1', 'm_1', 'm_2', 'Backlog', 'Medium', 'Research', 8, 3, 2),
    buildTask('t_4', 'Create task creation flow', 'p_2', 'm_4', 'm_3', 'In Progress', 'Critical', 'Feature', 5, 9, 0),
    buildTask('t_5', 'Fix project member assignment edge case', 'p_2', 'm_3', 'm_4', 'Backlog', 'High', 'Bug', 1, 2, 0),
    buildTask('t_6', 'Document onboarding checklist', 'p_2', 'm_5', 'm_2', 'Done', 'Low', 'Ops', -1, 12, 3),
    buildTask('t_7', 'Backfill weekly support report', 'p_3', 'm_4', 'm_1', 'Done', 'Low', 'Ops', -8, 16, 6),
    buildTask('t_8', 'Review handoff notes', 'p_3', 'm_2', 'm_1', 'Done', 'Medium', 'Research', -3, 14, 4),
    buildTask('t_9', 'Prepare stakeholder demo', 'p_2', 'm_1', 'm_3', 'In Review', 'High', 'Feature', 3, 6, 1),
  ]

  const workspace: Workspace = {
    id: 'ws_1',
    name: 'Northstar Team Workspace',
    slug: 'northstar',
    plan: 'Team',
    memberCount: members.length,
    projectCount: projects.length,
  }

  const comments: TaskComment[] = [
    buildComment('c_1', 't_4', 'm_3', 'We should keep the creation flow lightweight in this phase.', 2),
    buildComment('c_2', 't_4', 'm_4', 'I can take the modal validation pass after the detail page lands.', 1),
    buildComment('c_3', 't_2', 'm_2', 'Navigation update looks good. Check empty workspace states before merge.', 0),
  ]

  const activity: TaskActivity[] = [
    buildActivity('a_1', 't_4', 'm_3', 'Moved task to In Progress', 0),
    buildActivity('a_2', 't_2', 'm_2', 'Requested review from design systems owner', 0),
    buildActivity('a_3', 't_5', 'm_4', 'Raised priority after assignment edge case reproduced', 1),
    buildActivity('a_4', 't_1', 'm_1', 'Updated permissions notes and linked architecture draft', 2),
  ]

  return { workspace, members, projects, tasks, comments, activity }
}

function buildMember(
  id: string,
  name: string,
  email: string,
  role: WorkspaceRole,
  joinedDaysAgo: number,
  activeDaysAgo: number
): Member {
  return {
    id,
    name,
    email,
    avatar: createAvatar(name),
    role,
    status: 'Active',
    joinedAt: subDays(new Date(), joinedDaysAgo).toISOString(),
    lastActiveAt: subDays(new Date(), activeDaysAgo).toISOString(),
  }
}

function buildProject(input: {
  id: string
  name: string
  key: string
  description: string
  status: ProjectStatus
  progress: number
  ownerId: string
  memberIds: string[]
  dueOffset: number
  updatedOffset: number
}): Project {
  return {
    id: input.id,
    name: input.name,
    key: input.key,
    description: input.description,
    status: input.status,
    progress: input.progress,
    ownerId: input.ownerId,
    memberIds: input.memberIds,
    dueDate: addDays(new Date(), input.dueOffset).toISOString(),
    updatedAt: subDays(new Date(), input.updatedOffset).toISOString(),
  }
}

function buildTask(
  id: string,
  title: string,
  projectId: string,
  assigneeId: string,
  reporterId: string,
  status: TaskStatus,
  priority: TaskPriority,
  type: TaskType,
  dueOffset: number,
  createdDaysAgo: number,
  updatedDaysAgo: number
): Task {
  return {
    id,
    title,
    description: `${title} for the current delivery cycle.`,
    projectId,
    assigneeId,
    reporterId,
    status,
    priority,
    type,
    dueDate: addDays(new Date(), dueOffset).toISOString(),
    createdAt: subDays(new Date(), createdDaysAgo).toISOString(),
    updatedAt: subDays(new Date(), updatedDaysAgo).toISOString(),
  }
}

export const createProjectId = () => createId('p')
export const createTaskId = () => createId('t')
export const createCommentId = () => createId('c')
export const createActivityId = () => createId('a')

function buildComment(
  id: string,
  taskId: string,
  authorId: string,
  body: string,
  daysAgo: number
): TaskComment {
  return {
    id,
    taskId,
    authorId,
    body,
    createdAt: subDays(new Date(), daysAgo).toISOString(),
  }
}

function buildActivity(
  id: string,
  taskId: string,
  actorId: string,
  message: string,
  daysAgo: number
): TaskActivity {
  return {
    id,
    taskId,
    actorId,
    message,
    createdAt: subDays(new Date(), daysAgo).toISOString(),
  }
}
