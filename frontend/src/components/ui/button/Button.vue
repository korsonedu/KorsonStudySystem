<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary' | 'success'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    class?: string
    disabled?: boolean
  }>(),
  {
    variant: 'default',
    size: 'default',
    class: '',
    disabled: false
  }
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        success: 'bg-green-600 text-white hover:bg-green-700'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

const buttonClasses = computed(() => {
  return cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)
})

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<template>
  <button :class="buttonClasses" :disabled="disabled" @click="handleClick">
    <slot />
  </button>
</template>
