<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import DeviceDonutChart from '@/components/charts/DeviceDonutChart.vue'
import TrafficSourcesChart from '@/components/charts/TrafficSourcesChart.vue'
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart.vue'
import TopProductsChart from '@/components/charts/TopProductsChart.vue'
import TopCampaignsChart from '@/components/charts/TopCampaignsChart.vue'
import UserGrowthChart from '@/components/charts/UserGrowthChart.vue'
import { ArrowTrendingUpIcon, ChartBarIcon } from '@heroicons/vue/24/outline'

const store = useDataStore()

const funnelConversionRate = computed(
  () =>
    store.conversionFunnel.data[3] && store.conversionFunnel.data[0]
      ? Math.round((store.conversionFunnel.data[3] / store.conversionFunnel.data[0]) * 1000) / 10
      : 0
)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Deep dive into performance, behavior, and growth. All charts update by the selected date
        range.
      </p>
    </div>

    <!-- 2 Analytical Summaries -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        class="flex items-center gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
      >
        <div
          class="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"
        >
          <ArrowTrendingUpIcon class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue Growth</p>
          <p
            :class="[
              store.revenueGrowthPercent >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400',
              'text-xl font-bold',
            ]"
          >
            {{ store.revenueGrowthPercent >= 0 ? '+' : '' }}{{ store.revenueGrowthPercent }}%
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">vs previous period</p>
        </div>
      </div>
      <div
        class="flex items-center gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
      >
        <div
          class="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
        >
          <ChartBarIcon class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Funnel Conversion</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">{{ funnelConversionRate }}%</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Visit → Converted</p>
        </div>
      </div>
    </div>

    <!-- Revenue Trend -->
    <div
      class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
        <span
          :class="[
            store.revenueGrowthPercent >= 0
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
            'px-3 py-1.5 rounded-lg text-sm font-medium',
          ]"
        >
          {{ store.revenueGrowthPercent >= 0 ? '+' : '' }}{{ store.revenueGrowthPercent }}% vs
          previous period
        </span>
      </div>
      <RevenueChart :data="store.filteredSales" />
    </div>

    <!-- Device Breakdown + Traffic Sources -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Device Breakdown</h3>
        <DeviceDonutChart :chart-input="store.deviceBreakdown" />
      </div>
      <div
        class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Sources</h3>
        <TrafficSourcesChart :chart-input="store.trafficSources" />
      </div>
    </div>

    <!-- Conversion Funnel -->
    <div
      class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversion Funnel</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Visit → Sign Up → Trial → Converted
      </p>
      <ConversionFunnelChart :chart-input="store.conversionFunnel" />
    </div>

    <!-- Top Products + Top Campaigns -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          By revenue in selected period
        </p>
        <TopProductsChart
          v-if="store.topProducts.data.length > 0"
          :chart-input="store.topProducts"
        />
        <p v-else class="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          No product data in selected period
        </p>
      </div>
      <div
        class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Campaigns</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          By revenue attribution
        </p>
        <TopCampaignsChart :chart-input="store.topCampaigns" />
      </div>
    </div>

    <!-- User Growth -->
    <div
      class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Cumulative users over time (from join date)
      </p>
      <UserGrowthChart :chart-input="store.userGrowth" />
    </div>
  </div>
</template>
