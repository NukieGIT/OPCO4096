<template>
  <div>
    <p>This is TestComp2 with name: {{ customName }}</p>
    <button @click="onClick">Click me</button>
    <p>Button clicked {{ count }} times</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePaneState } from '@/composables/usePaneState'

type TestComp2State = {
  count: number
}

const { id, customName } = defineProps<{
  id: string
  customName?: string
}>()

const { state } = usePaneState<TestComp2State>(id, () => ({ count: 0 }))

const count = computed(() => state.value.count)

function onClick() {
  state.value.count += 1
}
</script>

<style scoped></style>
