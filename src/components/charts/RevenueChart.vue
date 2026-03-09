<script setup lang="ts">
import { computed } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  type ChartData
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { format, parseISO } from 'date-fns';
import type { Sale } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const props = defineProps<{ data: Sale[] }>();

const chartData = computed<ChartData<'line'>>(() => {

  const grouped = props.data.reduce((acc, sale) => {
    const date = format(parseISO(sale.date), 'MMM dd');
    acc[date] = (acc[date] || 0) + sale.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    labels: Object.keys(grouped),
    datasets: [
      {
        label: 'Revenue',
        data: Object.values(grouped),
        borderColor: '#6366f1', // Indigo-500
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#6366f1',
        pointBorderWidth: 2,
      }
    ]
  };
});

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
    y: { border: { dash: [4, 4] }, grid: { color: '#e5e7eb' }, ticks: { color: '#9ca3af', callback: (value: any) => '$' + value } }
  }
};
</script>

<template>
  <div class="w-full h-[300px]">
    <Line :data="chartData" :options="options" />
  </div>
</template>