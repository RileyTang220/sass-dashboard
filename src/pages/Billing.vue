<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import {
  CreditCardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import type { Plan, InvoiceStatus } from '@/types'

const store = useSubscriptionStore()

const planPrices: Record<Plan, number> = {
  Free: 0,
  Pro: 29,
  Enterprise: 99,
}

const statusBadgeClass = (status: InvoiceStatus) => {
  switch (status) {
    case 'paid':
      return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
    case 'pending':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
    case 'failed':
      return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

const statusBadgeClassSub = (status: string) => {
  return status === 'active'
    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Manage your plan, billing cycle, and invoice history.
      </p>
    </div>

    <!-- Current Plan Card -->
    <div
      class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div class="p-6 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
            >
              <CreditCardIcon class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Current Plan: {{ store.plan }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                ${{ planPrices[store.plan] }}/month
              </p>
            </div>
          </div>
          <span
            :class="[
              statusBadgeClassSub(store.status),
              'px-3 py-1 rounded-full text-sm font-medium capitalize',
            ]"
          >
            {{ store.status }}
          </span>
        </div>

        <!-- Canceled message -->
        <div
          v-if="store.isCanceled"
          class="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <p class="text-sm text-amber-800 dark:text-amber-200">
            Your subscription will end on
            <strong>{{ format(new Date(store.endDate), 'MMMM d, yyyy') }}</strong>.
          </p>
          <button
            @click="store.reactivateSubscription"
            class="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            Reactivate subscription
          </button>
        </div>

        <!-- Active: dates -->
        <div v-else class="mt-4 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>
            Started: <strong class="text-gray-700 dark:text-gray-300">{{
              format(new Date(store.startDate), 'MMM d, yyyy')
            }}</strong>
          </span>
          <span>
            Next billing: <strong class="text-gray-700 dark:text-gray-300">{{
              format(new Date(store.endDate), 'MMM d, yyyy')
            }}</strong>
          </span>
        </div>
      </div>

      <!-- Upgrade / Downgrade / Cancel -->
      <div class="p-6 flex flex-wrap gap-3">
        <button
          v-if="store.canUpgrade && store.nextPlan"
          @click="store.upgradePlan"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <ArrowUpIcon class="w-4 h-4" />
          Upgrade to {{ store.nextPlan }}
        </button>
        <button
          v-if="store.canDowngrade && store.prevPlan && !store.isCanceled"
          @click="store.downgradePlan"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
        >
          <ArrowDownIcon class="w-4 h-4" />
          Downgrade to {{ store.prevPlan }}
        </button>
        <button
          v-if="!store.isCanceled && store.plan !== 'Free'"
          @click="store.cancelSubscription"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
        >
          <XCircleIcon class="w-4 h-4" />
          Cancel subscription
        </button>
      </div>
    </div>

    <!-- Invoice History -->
    <div
      class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
    >
      <div class="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Invoice History</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Past invoices and billing records.
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="inv in store.invoices"
              :key="inv.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                {{ format(new Date(inv.date), 'MMM d, yyyy') }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {{ inv.description }}
              </td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                ${{ inv.amount.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    statusBadgeClass(inv.status),
                    'px-2 py-1 rounded-full text-xs font-medium capitalize',
                  ]"
                >
                  {{ inv.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="store.invoices.length === 0"
        class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        No invoices yet.
      </div>
    </div>
  </div>
</template>
