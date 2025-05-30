<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="{
      '--normal-bg': 'var(--color-card-gray, #242424)',
      '--normal-text': 'var(--color-text-white, #ffffff)',
      '--normal-border': 'var(--color-border, rgba(255, 255, 255, 0.15))',
      '--success-bg': 'var(--color-card-gray, #242424)',
      '--success-text': 'var(--color-text-white, #ffffff)',
      '--success-border': 'var(--color-border, rgba(255, 255, 255, 0.15))',
      '--error-bg': 'var(--color-card-gray, #242424)',
      '--error-text': 'var(--color-text-white, #ffffff)',
      '--error-border': 'var(--color-border, rgba(255, 255, 255, 0.15))',
      '--toast-shadow': 'var(--shadow-card, 0 6px 12px rgba(0, 0, 0, 0.5))'
    }"
  />
</template>
