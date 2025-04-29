<template>
    <div class="chart-wrapper">
      <canvas ref="chart"></canvas>
    </div>
  </template>
  
  <script>
  import Chart from 'chart.js/auto'
  
  export default {
    props: ['data'],
    data: () => ({
      chart: null
    }),
    watch: {
      data: {
        handler: 'updateChart',
        deep: true
      }
    },
    mounted() {
      this.initChart()
    },
    beforeDestroy() {
      if (this.chart) this.chart.destroy()
    },
    methods: {
      initChart() {
        this.chart = new Chart(this.$refs.chart, {
          type: 'bar',
          data: this.chartData,
          options: {
            responsive: true,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        })
      },
      updateChart() {
        if (this.chart) {
          this.chart.data = this.chartData
          this.chart.update()
        }
      }
    },
    computed: {
      chartData() {
        const durationData = {
          short: this.data.filter(t => t.duration <= 25).length,
          medium: this.data.filter(t => t.duration > 25 && t.duration <= 50).length,
          long: this.data.filter(t => t.duration > 50).length
        }
  
        return {
          labels: ['短时 (≤25m)', '中时 (26-50m)', '长时 (>50m)'],
          datasets: [{
            data: [durationData.short, durationData.medium, durationData.long],
            backgroundColor: ['#3498db', '#2ecc71', '#9b59b6']
          }]
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .chart-wrapper {
    height: 300px;
  }
  </style>