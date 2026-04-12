import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { format, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns'
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
import {
  createActivityId,
  createCommentId,
  createMockWorkspaceSeed,
  createProjectId,
  createTaskId,
} from '@/utils/mockData'

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

  const initData = async () => {
    initError.value = null
    try {
      const seed = createMockWorkspaceSeed()
      workspace.value = seed.workspace
      members.value = seed.members
      projects.value = seed.projects
      tasks.value = seed.tasks
      taskComments.value = seed.comments
      taskActivity.value = seed.activity
    } catch (error) {
      initError.value = error instanceof Error ? error.message : 'Failed to load workspace data'
    }
  }

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

  const getProjectById = (projectId: string) =>
    projectRows.value.find((project) => project.id === projectId) ?? null

  const getProjectTasks = (projectId: string) =>
    taskRows.value.filter((task) => task.projectId === projectId)

  const getProjectMembers = (projectId: string) => {
    const project = projects.value.find((entry) => entry.id === projectId)
    if (!project) return []
    return members.value.filter((member) => project.memberIds.includes(member.id))
  }

  const syncProfile = (name: string, email: string) => {
    const existing = members.value.find((member) => member.email === email)
    if (existing) {
      existing.name = name
      existing.avatar = avatarFor(name)
      return
    }

    members.value.unshift({
      id: `m_${Math.random().toString(36).slice(2, 10)}`,
      name,
      email,
      avatar: avatarFor(name),
      role: 'Owner',
      status: 'Active',
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    })
  }

  const addProject = (input: ProjectInput) => {
    projects.value.unshift({
      id: createProjectId(),
      name: input.name,
      key: input.key.toUpperCase(),
      description: input.description,
      status: 'On Track',
      progress: 0,
      ownerId: input.ownerId,
      memberIds: input.memberIds?.length ? input.memberIds : [input.ownerId],
      dueDate: input.dueDate,
      updatedAt: new Date().toISOString(),
    })
  }

  const deleteProject = (projectId: string) => {
    projects.value = projects.value.filter((project) => project.id !== projectId)
    tasks.value = tasks.value.filter((task) => task.projectId !== projectId)
  }

  const addTask = (input: TaskInput) => {
    const now = new Date().toISOString()
    const newTask = {
      id: createTaskId(),
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      assigneeId: input.assigneeId,
      reporterId: input.assigneeId,
      status: input.status ?? 'Backlog',
      priority: input.priority,
      type: input.type,
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
    }
    tasks.value.unshift(newTask)
    taskActivity.value.unshift({
      id: createActivityId(),
      taskId: newTask.id,
      actorId: input.assigneeId,
      message: 'Created task',
      createdAt: now,
    })
    touchProject(input.projectId)
  }

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const task = tasks.value.find((entry) => entry.id === taskId)
    if (!task) return
    task.status = status
    task.updatedAt = new Date().toISOString()
    taskActivity.value.unshift({
      id: createActivityId(),
      taskId,
      actorId: task.assigneeId,
      message: `Changed status to ${status}`,
      createdAt: task.updatedAt,
    })
    touchProject(task.projectId)
  }

  const updateTaskAssignee = (taskId: string, assigneeId: string) => {
    const task = tasks.value.find((entry) => entry.id === taskId)
    if (!task) return
    task.assigneeId = assigneeId
    task.updatedAt = new Date().toISOString()
    taskActivity.value.unshift({
      id: createActivityId(),
      taskId,
      actorId: assigneeId,
      message: 'Updated assignee',
      createdAt: task.updatedAt,
    })
    touchProject(task.projectId)
  }

  const updateTaskProject = (taskId: string, projectId: string) => {
    const task = tasks.value.find((entry) => entry.id === taskId)
    if (!task || task.projectId === projectId) return
    const previousProjectId = task.projectId
    task.projectId = projectId
    task.updatedAt = new Date().toISOString()
    taskActivity.value.unshift({
      id: createActivityId(),
      taskId,
      actorId: task.assigneeId,
      message: 'Moved task to another project',
      createdAt: task.updatedAt,
    })
    touchProject(previousProjectId)
    touchProject(projectId)
  }

  const updateTaskDescription = (taskId: string, description: string) => {
    const task = tasks.value.find((entry) => entry.id === taskId)
    if (!task) return
    task.description = description
    task.updatedAt = new Date().toISOString()
    taskActivity.value.unshift({
      id: createActivityId(),
      taskId,
      actorId: task.assigneeId,
      message: 'Updated task description',
      createdAt: task.updatedAt,
    })
  }

  const addTaskComment = (taskId: string, authorId: string, body: string) => {
    const now = new Date().toISOString()
    taskComments.value.push({
      id: createCommentId(),
      taskId,
      authorId,
      body,
      createdAt: now,
    })
    taskActivity.value.unshift({
      id: createActivityId(),
      taskId,
      actorId: authorId,
      message: 'Added a comment',
      createdAt: now,
    })
  }

  const deleteTask = (taskId: string) => {
    const task = tasks.value.find((entry) => entry.id === taskId)
    tasks.value = tasks.value.filter((entry) => entry.id !== taskId)
    taskComments.value = taskComments.value.filter((entry) => entry.taskId !== taskId)
    taskActivity.value = taskActivity.value.filter((entry) => entry.taskId !== taskId)
    if (task) touchProject(task.projectId)
  }

  const updateMemberRole = (memberId: string, role: WorkspaceRole) => {
    const member = members.value.find((entry) => entry.id === memberId)
    if (member) member.role = role
  }

  const touchProject = (projectId: string) => {
    const project = projects.value.find((entry) => entry.id === projectId)
    if (!project) return

    const relatedTasks = tasks.value.filter((task) => task.projectId === projectId)
    const doneCount = relatedTasks.filter((task) => task.status === 'Done').length
    project.progress = relatedTasks.length === 0 ? 0 : Math.round((doneCount / relatedTasks.length) * 100)
    project.updatedAt = new Date().toISOString()

    if (project.progress === 100) {
      project.status = 'Completed'
      return
    }

    const today = startOfDay(new Date()).getTime()
    const hasCriticalOverdueTask = relatedTasks.some(
      (task) =>
        task.priority === 'Critical' &&
        task.status !== 'Done' &&
        parseISO(task.dueDate).getTime() < today
    )

    if (hasCriticalOverdueTask) {
      project.status = 'Off Track'
      return
    }

    const hasHighPriorityWork = relatedTasks.some(
      (task) => task.priority === 'High' && task.status !== 'Done'
    )

    project.status = hasHighPriorityWork ? 'At Risk' : 'On Track'
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
  }
})

function avatarFor(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=ffffff`
}
