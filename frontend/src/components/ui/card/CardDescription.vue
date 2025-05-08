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

const descriptionClasses = computed(() => {
  return cn('text-sm text-muted-foreground', props.class)
})
</script>

<template>
  <p :class="descriptionClasses">
    <slot />
  </p>
</template>
