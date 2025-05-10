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

const footerClasses = computed(() => {
  return cn('flex items-center p-6 pt-0', props.class)
})
</script>

<template>
  <div :class="footerClasses">
    <slot />
  </div>
</template>
