<template>

<div>
  <p>This is TestComp1 with name: {{ customName }}</p>
  <input v-model="text" type="text">
</div>

</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePaneState } from '@/composables/usePaneState'

type TestComp1State = {
  text: string
}

const { id, customName } = defineProps<{
  id: string
  customName?: string
}>()

const { state } = usePaneState<TestComp1State>(id, () => ({ text: '' }))

const text = computed({
  get: () => state.value.text,
  set: (value: string) => {
    state.value.text = value
  }
})

</script>

<style scoped>



</style>
