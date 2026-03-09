<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartData,
} from 'chart.js'
import { computed } from 'vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{
  chartInput: { labels: string[]; data: number[] }
}>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.chartInput.labels,
  datasets: [
    {
      label: 'Total Users',
      data: props.chartInput.data,
      borderColor: '#10b981',
      backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
        const ctx = context.chart.ctx
        const gradient = ctx.createLinearGradient(0, 0, 0, 300)
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)')
        return gradient
      },
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#10b981',
      pointBorderWidth: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
    y: {
      border: { dash: [4, 4] },
      grid: { color: '#e5e7eb' },
      ticks: { color: '#9ca3af', precision: 0 },
    },
  },
}
</script>

<template>
  <div class="w-full h-[280px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
