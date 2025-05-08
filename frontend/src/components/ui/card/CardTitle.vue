<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: string
    as?: string
  }>(),
  {
    class: '',
    as: 'h3'
  }
)

const titleClasses = computed(() => {
  return cn(
    'text-2xl font-semibold leading-none tracking-tight',
    props.class
  )
})
</script>

<template>
  <component :is="as" :class="titleClasses">
    <slot />
  </component>
</template>
