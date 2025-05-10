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

const titleClasses = computed(() => {
  return `mb-1 font-medium leading-none tracking-tight ${props.class}`
})
</script>

<template>
  <h5 :class="titleClasses">
    <slot />
  </h5>
</template>
