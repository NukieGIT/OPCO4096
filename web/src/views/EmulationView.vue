<template>
  <h1>Emulation Page</h1>
</template>

<script setup lang="ts">
const importObject: WebAssembly.Imports = {}

const wasmUrl = `/OPCO4096-wasm.wasm?t=${Date.now()}`

WebAssembly.instantiateStreaming(fetch(wasmUrl, { cache: 'no-store' }), importObject).then(
  ({ instance }) => {
    console.log(instance.exports.add(1, 5));

  },
)
</script>

<style scoped></style>
