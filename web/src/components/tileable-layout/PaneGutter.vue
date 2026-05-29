<template>

<div class="gutter" :data-direction="direction" ref="gutter"></div>

</template>

<script setup lang="ts">
import type { SplitDirection } from '@/components/tileable-layout/types';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'
import { computed, onMounted, ref, useTemplateRef } from 'vue';

const { direction } = defineProps<{
  direction: SplitDirection
}>()

const gutterRef = useTemplateRef('gutter');
let baseGutterDiff = 0;
const gutterDiff = ref(0);
const gutterDiffCss = computed(() => gutterDiff.value + 'px')

onMounted(() => {
  if (!gutterRef.value) {
    console.error('Gutter element not found');
    return;
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
    onDragStart() {
      baseGutterDiff = gutterDiff.value;
    },
    onDrag({ location }) {
      if (direction === 'row') {
        const diffX = location.current.input.clientX - location.initial.input.clientX
        gutterDiff.value = baseGutterDiff + diffX
      } else {
        const diffY = location.current.input.clientY - location.initial.input.clientY
        gutterDiff.value = baseGutterDiff + diffY
      }
    },
    onDrop() {
      preventUnhandled.stop()
    }
  })
})

defineExpose({
  gutterDiffCss
})

</script>

<style scoped>

.gutter {
  position: relative;
  background: transparent;
  cursor: col-resize;
  transition: background-color 120ms ease;
  transition-delay: 0ms;
}

.gutter[data-direction='row'] {
  grid-column: 2;
  grid-row: 1;
}

.gutter[data-direction='column'] {
  grid-column: 1;
  grid-row: 2;
  cursor: row-resize;
}

.gutter::before {
  content: '';
  position: absolute;
  background: var(--gutter-line);
}

.gutter[data-direction='row']::before {
  top: 0;
  bottom: 0;
  left: calc(50% - 0.5px);
  width: 1px;
}

.gutter[data-direction='column']::before {
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
