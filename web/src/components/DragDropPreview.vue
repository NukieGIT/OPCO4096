<template>

<div v-if="isVisible" class="preview"></div>

</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const isVisible = ref(false);

const width = ref(0);
const height = ref(0);
const top = ref(0);
const left = ref(0);

const widthCss = computed(() => `${width.value}px`);
const heightCss = computed(() => `${height.value}px`);
const topCss = computed(() => `${top.value}px`);
const leftCss = computed(() => `${left.value}px`);

function moveTo(x: number, y: number) {
  top.value = y;
  left.value = x;
}

function resizeTo(x: number, y: number) {
  width.value = Math.abs(left.value - x);
  height.value = Math.abs(top.value - y);
}

defineExpose({
  isVisible,
  moveTo,
  resizeTo
})

</script>

<style scoped>

.preview {
  position: absolute;
  background-color: rgba(0, 153, 255, 0.1);
  border: 2px dashed #0070f3;
  pointer-events: none;

  transition: top 100ms ease, left 100ms ease, width 100ms ease, height 100ms ease;

  width: v-bind(widthCss);
  height: v-bind(heightCss);
  top: v-bind(topCss);
  left: v-bind(leftCss);
}

</style>
