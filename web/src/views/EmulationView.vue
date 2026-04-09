<template>
  <h1>Emulation Page</h1>
</template>

<script setup lang="ts">
const zjb = new window.Zjb()
const importObject: WebAssembly.Imports = {
  zjb: zjb.imports,
}

async function load() {
  const response = await fetch("/OPCO4096-wasm.wasm")
  let result: WebAssembly.WebAssemblyInstantiatedSource
  try {
    result = await WebAssembly.instantiateStreaming(response, importObject)
  } catch {
    console.warn("WebAssembly.instantiateStreaming failed, falling back to ArrayBuffer instantiation. Not supported?")
    const bytes = await response.arrayBuffer()
    result = await WebAssembly.instantiate(bytes, importObject)
  }

  zjb.setInstance(result.instance)

  const exportsObj = result.instance.exports
  console.log(exportsObj.add(1, 5))
  exportsObj.hello_from_zig()
}

void load()
</script>

<style scoped></style>
