import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { format, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/api/client'
import type {
  DateRange,
  Member,
  Project,
  ProjectStatus,
  TaskActivity,
  TaskComment,
  Task,
  TaskStatus,
  Workspace,
  WorkspaceRole,
} from '@/types'

type ProjectInput = Pick<Project, 'name' | 'key' | 'description' | 'ownerId' | 'dueDate'> & {
  memberIds?: string[]
}

type TaskInput = Pick<
  Task,
  'title' | 'description' | 'projectId' | 'assigneeId' | 'priority' | 'type' | 'dueDate'
> & {
  status?: TaskStatus
}

export const useDataStore = defineStore('data', () => {
  const authStore = useAuthStore()
  const workspace = ref<Workspace | null>(null)
  const members = ref<Member[]>([])
  const projects = ref<Project[]>([])
  const tasks = ref<Task[]>([])
  const taskComments = ref<TaskComment[]>([])
  const taskActivity = ref<TaskActivity[]>([])
  const initError = ref<string | null>(null)

  const dateRange = ref<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
    label: 'Last 30 Days',
  })

  // ── Load data from API ──────────────────────────────
  const initData = async () => {
    initError.value = null
    try {
      const [ws, memberList, projectList, taskList] = await Promise.all([
        api.workspace.get(),
        api.members.list(),
        api.projects.list(),
        api.tasks.list(),
      ])
      workspace.value = ws
      members.value = memberList
      projects.value = projectList
      tasks.value = taskList
    } catch (error) {
      initError.value = error instanceof Error ? error.message : 'Failed to load workspace data'
    }
  }

  const currentMember = computed(
    () => members.value.find((member) => member.email === authStore.user?.email) ?? null
  )

  const currentRole = computed<WorkspaceRole>(() => currentMember.value?.role ?? 'Guest')
  const canManageProjects = computed(() => ['Owner', 'Admin'].includes(currentRole.value))
  const canManageMembers = computed(() => ['Owner', 'Admin'].includes(currentRole.value))
  const canCreateTasks = computed(() => ['Owner', 'Admin', 'Member'].includes(currentRole.value))
  const canCommentOnTasks = computed(() => ['Owner', 'Admin', 'Member'].includes(currentRole.value))

  const tasksInRange = computed(() =>
    tasks.value.filter((task) => {
      const updatedAt = parseISO(task.updatedAt)
      return isWithinInterval(updatedAt, {
        start: dateRange.value.start,
        end: dateRange.value.end,
      })
    })
  )

  const openTasks = computed(() => tasks.value.filter((task) => task.status !== 'Done'))
  const overdueTasks = computed(() =>
    tasks.value.filter((task) => task.status !== 'Done' && parseISO(task.dueDate) < new Date())
  )
  const activeProjects = computed(() =>
    projects.value.filter((project) => project.status !== 'Completed')
  )
  const completedTasksInRange = computed(
    () => tasksInRange.value.filter((task) => task.status === 'Done').length
  )
  const completionRate = computed(() => {
    if (tasksInRange.value.length === 0) return 0
    return Math.round((completedTasksInRange.value / tasksInRange.value.length) * 100)
  })

  const tasksByStatus = computed(() => {
    const base: Record<TaskStatus, number> = {
      Backlog: 0,
      'In Progress': 0,
      'In Review': 0,
      Done: 0,
    }
    for (const task of tasks.value) base[task.status] += 1
    return base
  })

  const projectsByStatus = computed(() => {
    const base: Record<ProjectStatus, number> = {
      'On Track': 0,
      'At Risk': 0,
      'Off Track': 0,
      Completed: 0,
    }
    for (const project of projects.value) base[project.status] += 1
    return base
  })

  const recentActivity = computed(() =>
    [...tasks.value]
      .sort((a, b) => parseISO(b.updatedAt).getTime() - parseISO(a.updatedAt).getTime())
      .slice(0, 6)
      .map((task) => ({
        ...task,
        project: projects.value.find((project) => project.id === task.projectId) ?? null,
        assignee: members.value.find((member) => member.id === task.assigneeId) ?? null,
      }))
  )

  const upcomingTasks = computed(() =>
    taskRows.value
      .filter((task) => task.status !== 'Done')
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
      .slice(0, 6)
  )

  const memberWorkload = computed(() =>
    members.value
      .map((member) => {
        const assignedOpenTasks = tasks.value.filter(
          (task) => task.assigneeId === member.id && task.status !== 'Done'
        )
        return {
          ...member,
          openTaskCount: assignedOpenTasks.length,
          inProgressCount: assignedOpenTasks.filter((task) => task.status === 'In Progress').length,
        }
      })
      .sort((a, b) => b.openTaskCount - a.openTaskCount)
  )

  const projectRows = computed(() =>
    projects.value.map((project) => ({
      ...project,
      owner: members.value.find((member) => member.id === project.ownerId) ?? null,
      taskCount: tasks.value.filter((task) => task.projectId === project.id).length,
      completedTaskCount: tasks.value.filter(
        (task) => task.projectId === project.id && task.status === 'Done'
      ).length,
    }))
  )

  const taskRows = computed(() =>
    tasks.value
      .map((task) => ({
        ...task,
        project: projects.value.find((project) => project.id === task.projectId) ?? null,
        assignee: members.value.find((member) => member.id === task.assigneeId) ?? null,
        reporter: members.value.find((member) => member.id === task.reporterId) ?? null,
      }))
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())
  )

  const memberRows = computed(() =>
    members.value.map((member) => ({
      ...member,
      projectCount: projects.value.filter((project) => project.memberIds.includes(member.id)).length,
      openTaskCount: tasks.value.filter(
        (task) => task.assigneeId === member.id && task.status !== 'Done'
      ).length,
    }))
  )

  const activityTrend = computed(() => {
    const days: { label: string; total: number; done: number }[] = []
    for (let offset = 6; offset >= 0; offset -= 1) {
      const currentDay = subDays(new Date(), offset)
      const dayTasks = tasks.value.filter(
        (task) => format(parseISO(task.updatedAt), 'yyyy-MM-dd') === format(currentDay, 'yyyy-MM-dd')
      )
      days.push({
        label: format(currentDay, 'MMM d'),
        total: dayTasks.length,
        done: dayTasks.filter((task) => task.status === 'Done').length,
      })
    }
    return days
  })

  const setDateRange = (start: Date, end: Date, label: string) => {
    dateRange.value = { start, end, label }
  }

  const getTaskById = (taskId: string) =>
    taskRows.value.find((task) => task.id === taskId) ?? null

  const getTaskComments = (taskId: string) =>
    taskComments.value
      .filter((comment) => comment.taskId === taskId)
      .map((comment) => ({
        ...comment,
        author: members.value.find((member) => member.id === comment.authorId) ?? null,
      }))
      .sort((a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime())

  const getTaskActivity = (taskId: string) =>
    taskActivity.value
      .filter((entry) => entry.taskId === taskId)
      .map((entry) => ({
        ...entry,
        actor: members.value.find((member) => member.id === entry.actorId) ?? null,
      }))
      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())

  const canEditTask = (taskId: string) => {
    const task = tasks.value.find((entry) => entry.id === taskId)
    if (!task || !currentMember.value) return false
    if (currentRole.value === 'Owner' || currentRole.value === 'Admin') return true
    if (currentRole.value === 'Guest') return false
    return task.assigneeId === currentMember.value.id || task.reporterId === currentMember.value.id
  }

  const getProjectById = (projectId: string) =>
    projectRows.value.find((project) => project.id === projectId) ?? null

  const getProjectTasks = (projectId: string) =>
    taskRows.value.filter((task) => task.projectId === projectId)

  const getProjectMembers = (projectId: string) => {
    const project = projects.value.find((entry) => entry.id === projectId)
    if (!project) return []
    return members.value.filter((member) => project.memberIds.includes(member.id))
  }

  // ── Fetch task comments & activity from API ──────────
  const fetchTaskComments = async (taskId: string) => {
    try {
      const data = await api.tasks.getComments(taskId)
      // Remove old comments for this task and add fresh ones
      taskComments.value = [
        ...taskComments.value.filter((c) => c.taskId !== taskId),
        ...data.map((c) => ({
          id: c.id,
          taskId: c.taskId,
          authorId: c.authorId,
          body: c.body,
          createdAt: c.createdAt,
        })),
      ]
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const fetchTaskActivity = async (taskId: string) => {
    try {
      const data = await api.tasks.getActivity(taskId)
      taskActivity.value = [
        ...taskActivity.value.filter((a) => a.taskId !== taskId),
        ...data.map((a) => ({
          id: a.id,
          taskId: a.taskId,
          actorId: a.actorId,
          message: a.message,
          createdAt: a.createdAt,
        })),
      ]
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    }
  }

  const syncProfile = (name: string, email: string) => {
    // No-op for real backend — profile is managed by auth
  }

  // ── Mutations (call API then update local state) ─────

  const addProject = async (input: ProjectInput) => {
    assertPermission(canManageProjects.value, 'Only owners and admins can create projects')
    const created = await api.projects.create({
      name: input.name,
      key: input.key.toUpperCase(),
      description: input.description,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      memberIds: input.memberIds,
    })
    projects.value.unshift(created)
  }

  const deleteProject = async (projectId: string) => {
    assertPermission(canManageProjects.value, 'Only owners and admins can delete projects')
    await api.projects.delete(projectId)
    projects.value = projects.value.filter((p) => p.id !== projectId)
    tasks.value = tasks.value.filter((t) => t.projectId !== projectId)
  }

  const addTask = async (input: TaskInput) => {
    assertPermission(canCreateTasks.value, 'Only owners, admins, and members can create tasks')
    const created = await api.tasks.create({
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      priority: input.priority,
      type: input.type,
      dueDate: input.dueDate,
      status: input.status,
    })
    tasks.value.unshift(created)
  }

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    assertPermission(canEditTask(taskId), 'You do not have permission to update this task')
    const updated = await api.tasks.update(taskId, { status })
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx !== -1) tasks.value[idx] = updated
  }

  const updateTaskAssignee = async (taskId: string, assigneeId: string) => {
    assertPermission(canEditTask(taskId), 'You do not have permission to reassign this task')
    const updated = await api.tasks.update(taskId, { assigneeId })
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx !== -1) tasks.value[idx] = updated
  }

  const updateTaskProject = async (taskId: string, projectId: string) => {
    assertPermission(canEditTask(taskId), 'You do not have permission to move this task')
    const updated = await api.tasks.update(taskId, { projectId })
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx !== -1) tasks.value[idx] = updated
  }

  const updateTaskDescription = async (taskId: string, description: string) => {
    assertPermission(canEditTask(taskId), 'You do not have permission to edit this task')
    const updated = await api.tasks.update(taskId, { description })
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx !== -1) tasks.value[idx] = updated
  }

  const addTaskComment = async (taskId: string, _authorId: string, body: string) => {
    assertPermission(canCommentOnTasks.value, 'Only owners, admins, and members can comment on tasks')
    const created = await api.tasks.addComment(taskId, body)
    taskComments.value.push({
      id: created.id,
      taskId: created.taskId,
      authorId: created.authorId,
      body: created.body,
      createdAt: created.createdAt,
    })
  }

  const deleteTask = async (taskId: string) => {
    assertPermission(canEditTask(taskId), 'You do not have permission to delete this task')
    await api.tasks.delete(taskId)
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
    taskComments.value = taskComments.value.filter((c) => c.taskId !== taskId)
    taskActivity.value = taskActivity.value.filter((a) => a.taskId !== taskId)
  }

  const updateMemberRole = async (memberId: string, role: WorkspaceRole) => {
    assertPermission(canManageMembers.value, 'Only owners and admins can manage roles')
    const updated = await api.members.updateRole(memberId, role)
    const idx = members.value.findIndex((m) => m.id === memberId)
    if (idx !== -1) members.value[idx] = updated
  }

  const addMember = async (data: {
    name: string
    email: string
    password: string
    role?: WorkspaceRole
    projectIds?: string[]
  }) => {
    assertPermission(canManageMembers.value, 'Only owners and admins can add members')
    const created = await api.members.add(data)
    members.value.push(created)
    return created
  }

  const inviteMember = async (data: { email: string; role?: WorkspaceRole }) => {
    assertPermission(canManageMembers.value, 'Only owners and admins can invite members')
    const result = await api.members.invite(data)
    // Add invited member to local list
    const idx = members.value.findIndex((m) => m.id === result.id)
    if (idx !== -1) {
      members.value[idx] = result
    } else {
      members.value.push(result)
    }
    return result
  }

  const removeMember = async (memberId: string) => {
    assertPermission(canManageMembers.value, 'Only owners and admins can remove members')
    await api.members.remove(memberId)
    members.value = members.value.filter((m) => m.id !== memberId)
  }

  return {
    workspace,
    members,
    projects,
    tasks,
    taskComments,
    taskActivity,
    initError,
    dateRange,
    currentMember,
    currentRole,
    canManageProjects,
    canManageMembers,
    canCreateTasks,
    canCommentOnTasks,
    tasksInRange,
    openTasks,
    overdueTasks,
    activeProjects,
    completedTasksInRange,
    completionRate,
    tasksByStatus,
    projectsByStatus,
    upcomingTasks,
    recentActivity,
    memberWorkload,
    projectRows,
    taskRows,
    memberRows,
    activityTrend,
    getProjectById,
    getProjectTasks,
    getProjectMembers,
    getTaskById,
    getTaskComments,
    getTaskActivity,
    fetchTaskComments,
    fetchTaskActivity,
    canEditTask,
    initData,
    setDateRange,
    syncProfile,
    addProject,
    deleteProject,
    addTask,
    updateTaskStatus,
    updateTaskAssignee,
    updateTaskProject,
    updateTaskDescription,
    addTaskComment,
    deleteTask,
    updateMemberRole,
    addMember,
    inviteMember,
    removeMember,
  }
})

function assertPermission(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}
