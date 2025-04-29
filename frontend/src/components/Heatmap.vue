<template>
    <div class="heatmap-container">
      <svg ref="heatmap" :width="width" :height="height" @mouseleave="hideTooltip">
        <!-- 热力格子 -->
        <rect 
          v-for="(item, hour) in heatData" 
          :key="hour"
          :x="getX(hour)"
          :y="0"
          :width="cellSize"
          :height="cellSize"
          :fill="getColor(item.count)"
          @mousemove="showTooltip($event, hour)"
          class="heat-cell"
        />
        
        <!-- 时间轴 -->
        <text 
          v-for="h in axisHours"
          :key="'axis-'+h"
          :x="getX(h) + cellSize/2"
          :y="height - 5"
          class="axis-text"
        >{{ h }}</text>
      </svg>
      
      <!-- 悬浮提示 -->
      <div 
        v-if="tooltip.visible"
        :style="{ 
          left: tooltip.x + 'px', 
          top: tooltip.y + 'px' 
        }"
        class="heat-tooltip"
      >
        <div>时间: {{ tooltip.hour }}:00 - {{ tooltip.hour + 1 }}:00</div>
        <div>学习次数: {{ tooltip.count }}</div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      data: Array, // 格式: [{hour: 0-23, count: Number}]
      width: { type: Number, default: 800 },
      cellSize: { type: Number, default: 40 }
    },
    data() {
      return {
        tooltip: {
          visible: false,
          x: 0,
          y: 0,
          hour: 0,
          count: 0
        }
      }
    },
    computed: {
      height() {
        return this.cellSize + 20 // 包含底部文字空间
      },
      heatData() {
        // 补全24小时数据
        return Array.from({length:24}, (_,h) => {
          const item = this.data.find(d => d.hour === h)
          return { hour: h, count: item ? item.count : 0 }
        })
      },
      axisHours() {
        return [0, 6, 12, 18, 23] // 关键时间点标注
      },
      maxCount() {
        return Math.max(...this.heatData.map(d => d.count)) || 1
      }
    },
    methods: {
      getX(hour) {
        return hour * this.cellSize
      },
      getColor(count) {
        const ratio = count / this.maxCount
        // 使用HSL颜色空间实现渐变
        const hue = 120 - (120 * ratio) // 从绿色到红色
        return `hsl(${hue}, 70%, 50%)`
      },
      showTooltip(event, hour) {
        this.tooltip = {
          visible: true,
          x: event.clientX + 10,
          y: event.clientY - 10,
          hour,
          count: this.heatData[hour].count
        }
      },
      hideTooltip() {
        this.tooltip.visible = false
      }
    }
  }
  </script>
  
  <style scoped>
  .heatmap-container {
    position: relative;
    margin: 20px 0;
  }
  
  .heat-cell {
    cursor: pointer;
    transition: fill 0.3s ease;
  }
  
  .heat-cell:hover {
    filter: brightness(1.2);
  }
  
  .axis-text {
    font-size: 12px;
    text-anchor: middle;
    fill: var(--text-color);
  }
  
  .heat-tooltip {
    position: fixed;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    pointer-events: none;
    font-size: 14px;
    z-index: 100;
  }
  </style>