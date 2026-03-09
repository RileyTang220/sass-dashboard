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

const colors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc']

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.chartInput.labels,
  datasets: [
    {
      label: 'Users',
      data: props.chartInput.data,
      backgroundColor: props.chartInput.labels.map((_, i) => colors[i % colors.length]),
      borderRadius: 6,
      barThickness: 28,
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
      ticks: { color: '#9ca3af', precision: 0 },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { size: 12 } },
    },
  },
}
</script>

<template>
  <div class="w-full h-[220px]">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
