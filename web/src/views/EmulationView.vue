<template>
  <h1>Emulation Page</h1>
</template>

<script setup lang="ts">
import getOpco from '@/ts/wasm/OPCO4096'

const opco = await getOpco()

opco.hello_from_zig()

</script>

<style scoped></style>
