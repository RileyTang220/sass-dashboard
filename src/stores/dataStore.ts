import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Sale, DateRange } from '@/types'
import { generateMockUsers, generateMockSales } from '@/utils/mockData'
import { isWithinInterval, parseISO, subDays, subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { api, getToken } from '@/api/client'

export const useDataStore = defineStore('data', () => {
  const users = ref<User[]>([])
  const sales = ref<Sale[]>([])
  const initError = ref<string | null>(null)

  const dateRange = ref<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
    label: 'Last 30 Days',
  })

  const initData = async () => {
    initError.value = null
    if (!getToken()) return
    try {
      const [usersRes, salesRes] = await Promise.all([
        api.users.list(),
        api.sales.list(),
      ])
      users.value = usersRes
      sales.value = salesRes
    } catch (e) {
      initError.value = e instanceof Error ? e.message : 'Failed to load data'
      console.warn('API init failed, using mock data:', initError.value)
      users.value = generateMockUsers(20)
      sales.value = generateMockSales(100)
    }
  }

  const filteredSales = computed(() => {
    return sales.value
      .filter((sale) => {
        const saleDate = parseISO(sale.date)
        return isWithinInterval(saleDate, {
          start: dateRange.value.start,
          end: dateRange.value.end,
        })
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  const totalRevenue = computed(() => {
    return filteredSales.value
      .filter((sale) => sale.status === 'Completed')
      .reduce((sum, sale) => sum + sale.amount, 0)
  })

  const recentSales = computed(() => filteredSales.value.slice(0, 5))

  const salesByMonth = computed(() => {
    const start = dateRange.value.start
    const end = dateRange.value.end
    const months: { label: string; start: Date; end: Date }[] = []
    let d = startOfMonth(start)
    while (d <= end) {
      months.push({
        label: format(d, 'MMM'),
        start: d,
        end: endOfMonth(d),
      })
      d = subMonths(d, -1)
    }

    const data = months.map((m) => {
      return filteredSales.value
        .filter((s) => s.status === 'Completed')
        .filter((s) => {
          const saleDate = parseISO(s.date)
          return isWithinInterval(saleDate, { start: m.start, end: m.end })
        })
        .reduce((sum, s) => sum + s.amount, 0)
    })

    return {
      labels: months.map((m) => m.label),
      data,
    }
  })

  const completedOrdersCount = computed(
    () => filteredSales.value.filter((s) => s.status === 'Completed').length
  )

  const averageOrderValue = computed(() => {
    const n = completedOrdersCount.value
    return n > 0 ? Math.round((totalRevenue.value / n) * 100) / 100 : 0
  })

  const previousPeriodRevenue = computed(() => {
    const start = dateRange.value.start
    const end = dateRange.value.end
    const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    const prevEnd = subDays(start, 1)
    const prevStart = subDays(prevEnd, days)
    return sales.value
      .filter((s) => s.status === 'Completed')
      .filter((s) => {
        const saleDate = parseISO(s.date)
        return isWithinInterval(saleDate, { start: prevStart, end: prevEnd })
      })
      .reduce((sum, s) => sum + s.amount, 0)
  })

  const revenueGrowthPercent = computed(() => {
    if (previousPeriodRevenue.value === 0) return 0
    return (
      Math.round(
        ((totalRevenue.value - previousPeriodRevenue.value) / previousPeriodRevenue.value) * 1000
      ) / 10
    )
  })

  const activeUsersCount = computed(
    () => users.value.filter((u) => u.status === 'Active').length
  )

  const conversionRate = computed(() => {
    const base = 3.2
    const trend = revenueGrowthPercent.value > 0 ? 0.4 : -0.2
    return Math.round((base + trend) * 10) / 10
  })

  const conversionRateTrendUp = computed(() => revenueGrowthPercent.value >= 0)

  const deviceBreakdown = computed(() => ({
    labels: ['Desktop', 'Mobile', 'Tablet'],
    data: [65, 25, 10],
  }))

  const trafficSources = computed(() => ({
    labels: ['Organic Search', 'Direct', 'Social Media', 'Referral', 'Paid Ads'],
    data: [35, 28, 18, 12, 7],
  }))

  const conversionFunnel = computed(() => ({
    labels: ['Visit', 'Sign Up', 'Trial', 'Converted'],
    data: [1000, 420, 180, 58],
  }))

  const topProducts = computed(() => {
    const grouped = filteredSales.value
      .filter((s) => s.status === 'Completed')
      .reduce((acc, s) => {
        acc[s.productName] = (acc[s.productName] || 0) + s.amount
        return acc
      }, {} as Record<string, number>)
    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
    return { labels: sorted.map(([k]) => k), data: sorted.map(([, v]) => v) }
  })

  const topCampaigns = computed(() => ({
    labels: ['Summer Sale 2024', 'Black Friday', 'Referral Program', 'Email Campaign', 'Paid Search'],
    data: [1240, 980, 650, 420, 380],
  }))

  const userGrowth = computed(() => {
    const start = dateRange.value.start
    const end = dateRange.value.end
    const months: { label: string; start: Date; end: Date }[] = []
    let d = startOfMonth(start)
    while (d <= end) {
      months.push({ label: format(d, 'MMM yyyy'), start: d, end: endOfMonth(d) })
      d = subMonths(d, -1)
    }
    const data = months.map((m) =>
      users.value.filter((u) => {
        const joined = parseISO(u.joinedDate)
        return isWithinInterval(joined, { start: m.start, end: m.end })
      }).length
    )
    const cumulative = data.reduce<number[]>((acc, n, i) => {
      acc.push((acc[i - 1] ?? 0) + n)
      return acc
    }, [])
    const totalBeforeStart = users.value.filter((u) => {
      const joined = parseISO(u.joinedDate)
      return joined < start
    }).length
    const labels = months.map((m) => m.label)
    const cumulativeData = cumulative.map((c, i) => totalBeforeStart + c)
    return { labels, data: cumulativeData }
  })

  const setDateRange = (start: Date, end: Date, label: string) => {
    dateRange.value = { start, end, label }
  }

  const addUser = async (user: Omit<User, 'id' | 'joinedDate'>) => {
    const newUser = await api.users.create({
      name: user.name,
      email: user.email,
      role: user.role,
    })
    users.value = [newUser, ...users.value]
  }
  const deleteUser = async (id: string) => {
    await api.users.delete(id)
    users.value = users.value.filter((u) => u.id !== id)
  }
  const updateUser = async (updatedUser: User) => {
    const updated = await api.users.update(updatedUser.id, {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
    })
    const index = users.value.findIndex((u) => u.id === updated.id)
    if (index !== -1) users.value[index] = updated
  }

  const addSale = async (sale: Omit<Sale, 'id'>) => {
    const newSale = await api.sales.create({
      customerName: sale.customerName,
      productName: sale.productName,
      amount: sale.amount,
      status: sale.status,
    })
    sales.value = [newSale, ...sales.value]
  }
  const updateSale = async (updatedSale: Sale) => {
    const updated = await api.sales.update(updatedSale.id, {
      customerName: updatedSale.customerName,
      productName: updatedSale.productName,
      amount: updatedSale.amount,
      status: updatedSale.status,
    })
    const index = sales.value.findIndex((s) => s.id === updated.id)
    if (index !== -1) sales.value[index] = updated
  }
  const deleteSale = async (id: string) => {
    await api.sales.delete(id)
    sales.value = sales.value.filter((s) => s.id !== id)
  }

  return {
    users,
    sales,
    dateRange,
    initError,

    filteredSales,
    totalRevenue,
    recentSales,
    salesByMonth,
    completedOrdersCount,
    averageOrderValue,
    previousPeriodRevenue,
    revenueGrowthPercent,
    activeUsersCount,
    conversionRate,
    conversionRateTrendUp,
    deviceBreakdown,
    trafficSources,
    conversionFunnel,
    topProducts,
    topCampaigns,
    userGrowth,

    initData,
    setDateRange,

    addUser,
    deleteUser,
    updateUser,

    addSale,
    updateSale,
    deleteSale,
  }
})
