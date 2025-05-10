<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    for?: string
    class?: string
  }>(),
  {
    for: undefined,
    class: ''
  }
)

const labelClasses = computed(() => {
  return `text-sm font-medium leading-none ${props.class}`
})
</script>

<template>
  <label :for="for" :class="labelClasses">
    <slot />
  </label>
</template>
