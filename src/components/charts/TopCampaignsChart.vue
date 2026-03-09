<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartData,
} from 'chart.js'
import { computed } from 'vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  chartInput: { labels: string[]; data: number[] }
}>()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.chartInput.labels,
  datasets: [
    {
      label: 'Revenue',
      data: props.chartInput.data,
      backgroundColor: '#8b5cf6',
      borderRadius: 4,
      barThickness: 20,
    },
  ],
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: '#e5e7eb' },
      ticks: { color: '#9ca3af', callback: (v: unknown) => '$' + v },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { size: 11 } },
    },
  },
}
</script>

<template>
  <div class="w-full h-[280px]">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
