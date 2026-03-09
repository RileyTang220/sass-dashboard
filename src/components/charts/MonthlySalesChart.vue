<script setup lang="ts">
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData
} from 'chart.js';
import { computed } from 'vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  chartInput: { labels: string[]; data: number[] };
}>();

const chartData = computed<ChartData<'bar'>>(() => {
  return {
    labels: props.chartInput.labels,
    datasets: [
      {
        label: 'Monthly Revenue',
        data: props.chartInput.data,
        backgroundColor: '#4f46e5', 
        borderRadius: 4,
      }
    ]
  };
});

const chartOptions = {
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
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>