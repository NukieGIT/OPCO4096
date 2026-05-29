import { computed } from 'vue'
import { usePaneStateStore } from '@/stores/panes'

export function usePaneState<T>(id: string, init: () => T) {
  const store = usePaneStateStore()
  const state = computed(() => store.ensure<T>(id, init))
  return {
    state,
    store
  }
}
