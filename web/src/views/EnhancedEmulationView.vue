<template>
  <main>
    <DragDropLayout :layout="layout" :panes="panes" />
  </main>
</template>

<script setup lang="ts">
import DragDropLayout from '@/components/drag-drop-layout/DragDropLayout.vue'
import TestComp1 from '@/components/TestComp1.vue'
import TestComp2 from '@/components/TestComp2.vue'
import { ref } from 'vue'
import type { LayoutNode } from '@/components/tileable-layout/types'
import type { PaneDefinition } from '@/components/drag-drop-layout/types'

// const panes: PaneDefinition = {
//   TestComp1: { is: TestComp1, props: {}, title: 'Test Component 1' },
//   TestComp2: { is: TestComp2, props: {}, title: 'Test Component 2' },
//   TestComp2FunnyNamed: {
//     is: TestComp2,
//     props: { customName: 'Funny Named TestComp2'.repeat(200) },
//     title: 'Funny Named Test Component 2',
//   },
// }

const panes: PaneDefinition = {
  NavigationTree: { is: TestComp1, props: {}, title: 'Navigation Tree' },
  ProjectExplorer: { is: TestComp1, props: {}, title: 'Project Explorer' },
  CodeEditor: { is: TestComp2, props: {}, title: 'Code Editorrrrrrrrrrrrrrrrrrrrrrrrrr' },
  Terminal: { is: TestComp2, props: {}, title: 'Terminal' },
  Inspector: { is: TestComp1, props: {}, title: 'Inspector' },
  ChatAssistant: { is: TestComp1, props: {}, title: 'Chat Assistant' },
}

const layout = ref<LayoutNode>({
  type: 'split',
  id: crypto.randomUUID(),
  direction: 'row',
  initialSizeBias: 0.25,
  children: [
    {
      type: 'split',
      id: crypto.randomUUID(),
      direction: 'column',
      initialSizeBias: 0.2,
      children: [
        { type: 'leaf', id: 'NavigationTree' },
        { type: 'leaf', id: 'ProjectExplorer' },
      ],
    },
    {
      type: 'split',
      id: crypto.randomUUID(),
      direction: 'row',
      children: [
        {
          type: 'split',
          id: crypto.randomUUID(),
          direction: 'column',
          initialSizeBias: 0.7,
          children: [
            { type: 'leaf', id: 'CodeEditor' },
            { type: 'leaf', id: 'Terminal' },
          ],
        },
        {
          type: 'split',
          id: crypto.randomUUID(),
          direction: 'column',
          children: [
            { type: 'leaf', id: 'Inspector' },
            { type: 'leaf', id: 'ChatAssistant' },
          ],
        },
      ],
    },
  ],
})

// const layout = ref<LayoutNode>({
//   type: 'split',
//   id: crypto.randomUUID(),
//   direction: 'row',
//   initialSizeBias: 0.25,
//   children: [
//     { type: 'leaf', id: 'TestComp1' },
//     {
//       type: 'split',
//       id: crypto.randomUUID(),
//       direction: 'column',
//       children: [
//         { type: 'leaf', id: 'TestComp2' },
//         { type: 'leaf', id: 'TestComp2FunnyNamed' },
//       ],
//     },
//   ],
// })
// const layout = ref<LayoutNode>({
//   type: 'leaf', id: 'TestComp2FunnyNamed'
// })
</script>

<style scoped>
main {
  height: 100dvh;
}
</style>
