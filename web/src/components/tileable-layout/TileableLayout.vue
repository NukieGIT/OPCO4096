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
    <div class="gutter" ref="gutter"></div>
  </div>
</template>

<script setup lang="ts">
import type { LayoutNode } from '@/components/tileable-layout/types'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'
import { computed, ref, useTemplateRef, watch } from 'vue'

defineSlots<{ leaf(props: { id: string }): void }>()

const { node } = defineProps<{ node: LayoutNode }>()

const gutterRef = useTemplateRef('gutter')
const gutterDiff = ref(0);
const gutterDiffCss = computed(() => gutterDiff.value + 'px')

watch(gutterRef, (newVal) => {
  if (!newVal) {
    console.error('Gutter element not found')
    return
  }

  draggable({
    element: gutterRef.value!,
    onGenerateDragPreview: ({ nativeSetDragImage }) => {
      // we will be moving the line to indicate a drag
      // we can disable the native drag preview
      disableNativeDragPreview({ nativeSetDragImage })
      // we don't want any native drop animation for when the user
      // does not drop on a drop target. we want the drag to finish immediately
      preventUnhandled.start()
    },
    onDrag({ location }) {
      if (node.type === 'leaf') {
        console.warn('This should never happen: Attempted to drag gutter on a leaf node, ignoring.')
        return
      }
      if (node.direction === 'row') {
        const diffX = location.current.input.clientX - location.initial.input.clientX
        gutterDiff.value =+ diffX
      } else {
        const diffY = location.current.input.clientY - location.initial.input.clientY
        gutterDiff.value =+ diffY
      }
    },
    onDrop() {
      preventUnhandled.stop()
    }
  })
})
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
  grid-template-columns: calc(50% + v-bind(gutterDiffCss)) var(--gutter-size) calc(50% - v-bind(gutterDiffCss));
  grid-template-rows: 1fr;
  height: 100%;
}

.split[data-direction='column'] {
  grid-template-columns: 1fr;
  grid-template-rows: calc(50% + v-bind(gutterDiffCss)) var(--gutter-size) calc(50% - v-bind(gutterDiffCss));
}

.gutter {
  position: relative;
  background: transparent;
  cursor: col-resize;
  transition: background-color 120ms ease;
  transition-delay: 0ms;
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
  transition-delay: 300ms;
}

.gutter:active {
  background: color-mix(in oklab, var(--gutter-hover) 85%, transparent);
}
</style>
