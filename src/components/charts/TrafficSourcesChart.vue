<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js'
import { computed } from 'vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  chartInput: { labels: string[]; data: number[] }
}>()

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.chartInput.labels,
  datasets: [
    {
      data: props.chartInput.data,
      backgroundColor: ['#4f46e5', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b'],
      borderColor: 'transparent',
      hoverOffset: 4,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#9ca3af',
        boxWidth: 12,
        padding: 16,
        font: { size: 12 },
      },
    },
  },
}
</script>

<template>
  <div class="w-full h-[280px]">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
