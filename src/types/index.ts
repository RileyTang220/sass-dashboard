export interface DateRange {
  start: Date
  end: Date
  label: string
}

export type WorkspacePlan = 'Starter' | 'Team' | 'Business'
export type WorkspaceRole = 'Owner' | 'Admin' | 'Member' | 'Guest'
export type MemberStatus = 'Active' | 'Invited'
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'Completed'
export type TaskStatus = 'Backlog' | 'In Progress' | 'In Review' | 'Done'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type TaskType = 'Feature' | 'Bug' | 'Ops' | 'Research'

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: WorkspacePlan
  memberCount: number
  projectCount: number
}

export interface Member {
  id: string
  name: string
  email: string
  avatar: string
  role: WorkspaceRole
  status: MemberStatus
  joinedAt: string
  lastActiveAt: string
}

export interface Project {
  id: string
  name: string
  key: string
  description: string
  status: ProjectStatus
  progress: number
  ownerId: string
  memberIds: string[]
  dueDate: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  projectId: string
  assigneeId: string
  reporterId: string
  status: TaskStatus
  priority: TaskPriority
  type: TaskType
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  body: string
  createdAt: string
}

export interface TaskActivity {
  id: string
  taskId: string
  actorId: string
  message: string
  createdAt: string
}

export interface WorkspaceSeed {
  workspace: Workspace
  members: Member[]
  projects: Project[]
  tasks: Task[]
  comments: TaskComment[]
  activity: TaskActivity[]
}
