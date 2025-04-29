declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue-chartjs' {
  import { DefineComponent } from 'vue'
  export const Bar: DefineComponent<any, any, any>
  export const Line: DefineComponent<any, any, any>
  export const Pie: DefineComponent<any, any, any>
  export const Doughnut: DefineComponent<any, any, any>
  export const PolarArea: DefineComponent<any, any, any>
  export const Radar: DefineComponent<any, any, any>
  export const Bubble: DefineComponent<any, any, any>
  export const Scatter: DefineComponent<any, any, any>
}

declare module 'chart.js' {
  export const Chart: any
  export const CategoryScale: any
  export const LinearScale: any
  export const PointElement: any
  export const LineElement: any
  export const BarElement: any
  export const Title: any
  export const Tooltip: any
  export const Legend: any
  export const ArcElement: any
  export const RadialLinearScale: any
} 