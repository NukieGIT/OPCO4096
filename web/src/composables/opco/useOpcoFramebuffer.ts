import { useOpcoRuntime } from '@/composables/opco/useOpcoRuntime'

export function useOpcoFramebuffer() {
  const runtime = useOpcoRuntime()

  return {
    framebuffer: runtime.framebuffer,
    refreshFramebuffer: runtime.refreshFramebuffer,
  }
}
