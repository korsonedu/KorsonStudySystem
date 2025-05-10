<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    class?: string
  }>(),
  {
    class: ''
  }
)

const descriptionClasses = computed(() => {
  return `text-sm ${props.class}`
})
</script>

<template>
  <div :class="descriptionClasses">
    <slot />
  </div>
</template>
