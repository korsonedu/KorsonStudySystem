<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    class?: string
  }>(),
  {
    class: ''
  }
)

const contentClasses = computed(() => {
  return cn('p-6 pt-0', props.class)
})
</script>

<template>
  <div :class="contentClasses">
    <slot />
  </div>
</template>
