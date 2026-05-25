<template>
  <div class="screen-container crt-border">
    <ScreenComponent />
  </div>
</template>

<script setup lang="ts">
import ScreenComponent from '@/components/ScreenComponent.vue'
</script>

<style scoped>
.screen-container {
  aspect-ratio: 2 / 1;
  max-width: 100rem;
}
</style>
