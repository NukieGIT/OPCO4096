import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePaneStateStore = defineStore('paneState', () => {
  const panes = ref<Record<string, unknown>>({})

  function ensure<T>(id: string, init: () => T): T {
    if (!panes.value[id]) {
      panes.value[id] = init()
    }
    return panes.value[id] as T
  }

  function get<T>(id: string): T | undefined {
    return panes.value[id] as T | undefined
  }

  return {
    panes,
    ensure,
    get,
  }
})
