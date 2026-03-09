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

const props = withDefaults(
  defineProps<{
    chartInput?: { labels: string[]; data: number[] }
  }>(),
  {
    chartInput: () => ({ labels: ['Desktop', 'Mobile', 'Tablet'], data: [65, 25, 10] }),
  }
)

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.chartInput.labels,
  datasets: [
    {
      data: props.chartInput.data,
      backgroundColor: ['#4f46e5', '#3b82f6', '#60a5fa'],
      borderColor: 'transparent',
      hoverOffset: 4,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: '#9ca3af',
        boxWidth: 12,
        padding: 20,
      },
    },
  },
}
</script>

<template>
  <div class="w-full h-[300px]">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>