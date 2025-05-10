<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'destructive' | 'success'
    class?: string
  }>(),
  {
    variant: 'default',
    class: ''
  }
)

const alertClasses = computed(() => {
  const baseClasses = 'relative w-full rounded-lg border p-4'

  let variantClasses = ''
  if (props.variant === 'destructive') {
    variantClasses = 'border-red-500 text-red-700 bg-red-50'
  } else if (props.variant === 'success') {
    variantClasses = 'border-green-500 text-green-700 bg-green-50'
  } else {
    variantClasses = 'bg-white text-gray-900 border-gray-200'
  }

  return `${baseClasses} ${variantClasses} ${props.class}`
})
</script>

<template>
  <div :class="alertClasses" role="alert">
    <slot />
  </div>
</template>
