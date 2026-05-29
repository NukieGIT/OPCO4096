<template>

<div ref="pane" class="draggable-pane">
  <h2 ref="header" class="header">
    <slot name="header">Draggable Pane Header</slot>
  </h2>
  <div class="content">
    <slot>Draggable Pane Content</slot>
  </div>
</div>

</template>

<script setup lang="ts">
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { onMounted, ref, useTemplateRef } from 'vue';

const paneRef = useTemplateRef('pane');
const headerRef = useTemplateRef('header');

const { id } = defineProps<{
  id: string
}>();

const isDragging = ref(false);
const isDraggedOver = ref(false);

const draggingOverId = ref<string | null>(null);

function isId(str: unknown): str is string {
  return typeof str === 'string';
}

onMounted(() => {
  if (!paneRef.value || !headerRef.value) {
    console.error('Pane or header element not found');
    return;
  }

  draggable({
    element: paneRef.value,
    dragHandle: headerRef.value,
    getInitialData: () => {
      return { id };
    },
    onDragStart: () => {
      isDragging.value = true;
    },
    onDrop: () => {
      isDragging.value = false;
    },
  });

  dropTargetForElements({
    element: paneRef.value,
    getData: () => {
      return { id };
    },
    onDragEnter: ({ source }) => {
      isDraggedOver.value = true;
      if (!isId(source.data.id)) {
        return;
      }
      draggingOverId.value = source.data.id;
    },
    onDragLeave: () => {
      isDraggedOver.value = false;
      draggingOverId.value = null;
    },
    onDrop: () => {
      isDraggedOver.value = false;
      draggingOverId.value = null;
    }
  })
})

defineExpose({
  isDragging,
  isDraggedOver,
  draggingOverId
})

</script>

<style scoped>

.draggable-pane {
  border: 1px dotted #ccc;
  overflow: auto;
  height: 100%;
}

.header {
  position: sticky;
  top: 0;
  cursor: move;
  background-color: #2e2e2e;
  padding: 8px;
}

.content {
  padding: 8px;
}

</style>
