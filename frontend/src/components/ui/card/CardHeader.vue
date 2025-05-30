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

const headerClasses = computed(() => {
  return cn('flex flex-col space-y-2 p-8 pb-4', props.class)
})
</script>

<template>
  <div :class="headerClasses">
    <slot />
  </div>
</template>
