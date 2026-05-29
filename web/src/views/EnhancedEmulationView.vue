<template>

<main>
  <TileableLayout :node="layout">
    <template #leaf="{ id }">
      <DragDropPane :id="id">
        <template #header>
          <p>{{ panes[id]?.title || id }}</p>
        </template>
        <component v-if="panes[id]" :is="panes[id].is" v-bind="panes[id].props" :id="id" />
      </DragDropPane>
    </template>
  </TileableLayout>
  <DragDropPreview ref="dndPreview" />
</main>

</template>

<script setup lang="ts">
import DragDropPane from '@/components/DragDropPane.vue';
import TestComp1 from '@/components/TestComp1.vue';
import TestComp2 from '@/components/TestComp2.vue';
import type { LayoutNode } from '@/components/tileable-layout/types';
import TileableLayout from '@/components/tileable-layout/TileableLayout.vue';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { ref, useTemplateRef, type Component } from 'vue';
import { swapNodes } from '@/components/tileable-layout/layoutManager';
import DragDropPreview from '@/components/DragDropPreview.vue';

const dndPreviewRef = useTemplateRef('dndPreview')

interface PaneDefinition {
  [key: string]: {
    is: Component,
    props: Record<string, unknown>
    title?: string,
  }
}

const panes: PaneDefinition = {
  'TestComp1': { is: TestComp1, props: {}, title: 'Test Component 1' },
  'TestComp2': { is: TestComp2, props: {}, title: 'Test Component 2' },
  'TestComp2FunnyNamed': { is: TestComp2, props: { customName: 'Funny Named TestComp2' }, title: 'Funny Named Test Component 2' },
}

const layout = ref<LayoutNode>({
  type: 'split',
  id: crypto.randomUUID(),
  direction: 'row',
  children: [
    { type: 'leaf', id: 'TestComp1' },
    {
      type: 'split',
      id: crypto.randomUUID(),
      direction: 'column',
      children: [
        { type: 'leaf', id: 'TestComp2' },
        { type: 'leaf', id: 'TestComp2FunnyNamed' }
      ]
    }
  ]
});

function isId(id: unknown): id is string {
  return typeof id === 'string';
}

monitorForElements({
  onDrag({ source, location }) {
    const destination = location.current.dropTargets[0]
    if (!destination) {
      // if dragged outside of any drop targets
      return;
    }

    const destinationId = destination.data.id;
    const sourceId = source.data.id;

    if (!isId(sourceId) || !isId(destinationId)) {
      return;
    }

    if (sourceId === destinationId) {
      return;
    }

    if (!dndPreviewRef.value) {
      return;
    }

    dndPreviewRef.value.moveTo(destination.element)
    dndPreviewRef.value.isVisible = true;
  },
  onDrop({ source, location }) {
    const destination = location.current.dropTargets[0]
    if (!destination) {
      // if dropped outside of any drop targets
      return;
    }

    const destinationId = destination.data.id;
    const sourceId = source.data.id;

    if (!isId(sourceId) || !isId(destinationId)) {
      return;
    }

    if (sourceId === destinationId) {
      return;
    }

    if (!dndPreviewRef.value) {
      return;
    }

    dndPreviewRef.value.isVisible = false;
    swapNodes(layout.value, sourceId, destinationId);
  }
})

</script>

<style scoped>

main {
  height: 100dvh;
}

.dragging {
  border-color: #0070f3;
  border-width: 2px;
  border-style: dashed;
}

.dragging-over {
  background-color: rgba(0, 112, 243, 0.1);
}

</style>
