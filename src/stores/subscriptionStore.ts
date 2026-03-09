import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { addMonths } from 'date-fns'
import type { Plan, SubscriptionStatus, Invoice } from '@/types'
import { generateMockInvoices } from '@/utils/mockData'
import { api, getToken } from '@/api/client'

const PLAN_ORDER: Plan[] = ['Free', 'Pro', 'Enterprise']
const planIndex = (p: Plan) => PLAN_ORDER.indexOf(p)

export const useSubscriptionStore = defineStore('subscription', () => {
  const plan = ref<Plan>('Pro')
  const status = ref<SubscriptionStatus>('active')
  const startDate = ref(new Date().toISOString())
  const endDate = ref(addMonths(new Date(), 1).toISOString())
  const invoices = ref<Invoice[]>([])

  const init = async () => {
    if (!getToken()) return
    try {
      const [sub, invs] = await Promise.all([
        api.billing.getSubscription(),
        api.billing.getInvoices(),
      ])
      plan.value = sub.plan as Plan
      status.value = sub.status as SubscriptionStatus
      startDate.value = sub.startDate
      endDate.value = sub.endDate
      invoices.value = invs.map((inv) => ({
        ...inv,
        currency: (inv as Invoice & { currency?: string }).currency ?? 'USD',
      }))
    } catch {
      invoices.value = generateMockInvoices()
    }
  }

  const canUpgrade = computed(() => plan.value !== 'Enterprise')
  const canDowngrade = computed(() => plan.value !== 'Free')

  const nextPlan = computed<Plan | null>(() => {
    const idx = planIndex(plan.value)
    const next = PLAN_ORDER[idx + 1]
    return next ?? null
  })

  const prevPlan = computed<Plan | null>(() => {
    const idx = planIndex(plan.value)
    const prev = idx > 0 ? PLAN_ORDER[idx - 1] : undefined
    return prev ?? null
  })

  const isCanceled = computed(() => status.value === 'canceled')

  const upgradePlan = async () => {
    if (!nextPlan.value) return
    try {
      const sub = await api.billing.updateSubscription('upgrade')
      plan.value = sub.plan as Plan
      status.value = sub.status as SubscriptionStatus
      startDate.value = sub.startDate
      endDate.value = sub.endDate
    } catch {
      // keep local state on error
    }
  }

  const downgradePlan = async () => {
    if (!prevPlan.value) return
    try {
      const sub = await api.billing.updateSubscription('downgrade')
      plan.value = sub.plan as Plan
      status.value = sub.status as SubscriptionStatus
      startDate.value = sub.startDate
      endDate.value = sub.endDate
    } catch {
      // keep local state on error
    }
  }

  const cancelSubscription = async () => {
    try {
      const sub = await api.billing.updateSubscription('cancel')
      status.value = sub.status as SubscriptionStatus
      endDate.value = sub.endDate
    } catch {
      // keep local state on error
    }
  }

  const reactivateSubscription = async () => {
    try {
      const sub = await api.billing.updateSubscription('reactivate')
      status.value = sub.status as SubscriptionStatus
      startDate.value = sub.startDate
      endDate.value = sub.endDate
    } catch {
      // keep local state on error
    }
  }

  return {
    plan,
    status,
    startDate,
    endDate,
    invoices,
    canUpgrade,
    canDowngrade,
    nextPlan,
    prevPlan,
    isCanceled,
    init,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    reactivateSubscription,
  }
})
