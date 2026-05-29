<template>
  <div v-if="node.type === 'leaf'" class="pane">
    <slot name="leaf" :id="node.id"></slot>
  </div>

  <div v-else class="split" :data-direction="node.direction">
    <TileableLayout v-for="child in node.children" :key="child.id" :node="child">
      <template #leaf="{ id }">
        <slot name="leaf" :id="id" />
      </template>
    </TileableLayout>
    <div class="gutter"></div>
  </div>
</template>

<script setup lang="ts">
import type { LayoutNode } from '@/components/tileable-layout/types'

defineSlots<{ leaf(props: { id: string }): void }>()

const { node } = defineProps<{ node: LayoutNode }>()
</script>

<style scoped>
.pane {
  height: 100%;
}

.split {
  --gutter-size: 5px;
  --gutter-line: rgba(255, 255, 255, 0.25);
  --gutter-hover: rgb(0, 153, 255);
  display: grid;
  grid-template-columns: 1fr var(--gutter-size) 1fr;
  grid-template-rows: 1fr;
  height: 100%;
}

.split[data-direction='column'] {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr var(--gutter-size) 1fr;
}

.gutter {
  position: relative;
  background: transparent;
  cursor: col-resize;
  transition: background-color 120ms ease;
}

.split[data-direction='row'] > .gutter {
  grid-column: 2;
  grid-row: 1;
}

.split[data-direction='column'] > .gutter {
  grid-column: 1;
  grid-row: 2;
  cursor: row-resize;
}

.gutter::before {
  content: '';
  position: absolute;
  background: var(--gutter-line);
}

.split[data-direction='row'] > .gutter::before {
  top: 0;
  bottom: 0;
  left: calc(50% - 0.5px);
  width: 1px;
}

.split[data-direction='column'] > .gutter::before {
  left: 0;
  right: 0;
  top: calc(50% - 0.5px);
  height: 1px;
}

.gutter:hover {
  background: color-mix(in oklab, var(--gutter-hover) 60%, transparent);
}

.gutter:active {
  background: color-mix(in oklab, var(--gutter-hover) 85%, transparent);
}
</style>
