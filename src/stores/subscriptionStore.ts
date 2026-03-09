import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { addMonths } from 'date-fns'
import type { Plan, SubscriptionStatus, Invoice } from '@/types'
import { generateMockInvoices } from '@/utils/mockData'

const STORAGE_KEY = 'saas_dashboard_subscription'
const INVOICES_KEY = 'saas_dashboard_invoices'

const PLAN_ORDER: Plan[] = ['Free', 'Pro', 'Enterprise']
const planIndex = (p: Plan) => PLAN_ORDER.indexOf(p)

export const useSubscriptionStore = defineStore('subscription', () => {
  const plan = ref<Plan>('Pro')
  const status = ref<SubscriptionStatus>('active')
  const startDate = ref(new Date().toISOString())
  const endDate = ref(addMonths(new Date(), 1).toISOString())
  const invoices = ref<Invoice[]>(generateMockInvoices())

  const init = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        plan.value = parsed.plan ?? 'Pro'
        status.value = parsed.status ?? 'active'
        startDate.value = parsed.startDate ?? startDate.value
        endDate.value = parsed.endDate ?? endDate.value
      } catch {
        // keep defaults
      }
    }
    const storedInvoices = localStorage.getItem(INVOICES_KEY)
    if (storedInvoices) {
      try {
        invoices.value = JSON.parse(storedInvoices)
      } catch {
        // keep mock
      }
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

  const updateBillingDates = () => {
    const now = new Date()
    startDate.value = now.toISOString()
    endDate.value = addMonths(now, 1).toISOString()
  }

  const upgradePlan = () => {
    if (!nextPlan.value) return
    plan.value = nextPlan.value
    status.value = 'active'
    updateBillingDates()
    addInvoice(plan.value, 'paid')
  }

  const downgradePlan = () => {
    if (!prevPlan.value) return
    plan.value = prevPlan.value
    status.value = 'active'
    updateBillingDates()
    addInvoice(plan.value, 'paid')
  }

  const addInvoice = (p: Plan, invStatus: Invoice['status']) => {
    const amounts: Record<Plan, number> = { Free: 0, Pro: 29, Enterprise: 99 }
    const now = new Date()
    invoices.value.unshift({
      id: `inv_${Math.random().toString(36).slice(2)}`,
      amount: amounts[p],
      currency: 'USD',
      date: now.toISOString(),
      status: invStatus,
      description: `${p} Plan - ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    })
  }

  const cancelSubscription = () => {
    status.value = 'canceled'
  }

  const reactivateSubscription = () => {
    status.value = 'active'
    updateBillingDates()
  }

  watch(
    () => ({ plan: plan.value, status: status.value, startDate: startDate.value, endDate: endDate.value }),
    (s) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    },
    { deep: true }
  )

  watch(invoices, (val) => {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(val))
  }, { deep: true })

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
