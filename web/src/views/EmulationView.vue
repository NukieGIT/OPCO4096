<template>
  <h1>Emulation Page</h1>
  <p>{{ a }} + {{ b }} = {{ result }}</p>
  <input type="number" v-model="a" />
  <input type="number" v-model="b" />
</template>

<script setup lang="ts">
import { opco } from '@/ts/wasm/OPCO4096'
import { computed, ref } from 'vue'

opco.hello_from_zig()

const a = ref<number>(5)
const b = ref<number>(3)

const result = computed(() => {
  return opco.add(a.value, b.value)
})
</script>

<style scoped></style>
