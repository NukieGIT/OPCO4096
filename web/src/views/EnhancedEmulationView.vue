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

// const panes: PaneDefinition = {
//   NavigationTree: { is: TestComp1, props: {}, title: 'Navigation Tree' },
//   ProjectExplorer: { is: TestComp1, props: {}, title: 'Project Explorer' },
//   Bookmarks: { is: TestComp1, props: {}, title: 'Bookmarks' },
//   SearchResults: { is: TestComp1, props: {}, title: 'Search Results' },

//   Editor1: { is: TestComp2, props: {}, title: 'Editor 1' },
//   Editor2: { is: TestComp2, props: {}, title: 'Editor 2' },
//   Editor3: { is: TestComp2, props: {}, title: 'Editor 3' },

//   Preview: { is: TestComp1, props: {}, title: 'Preview' },
//   APIReference: { is: TestComp1, props: {}, title: 'API Reference' },

//   AIChat: { is: TestComp1, props: {}, title: 'AI Chat' },
//   PromptLibrary: { is: TestComp1, props: {}, title: 'Prompt Library' },
//   ModelInspector: { is: TestComp1, props: {}, title: 'Model Inspector' },

//   Terminal1: { is: TestComp2, props: {}, title: 'Terminal 1' },
//   Terminal2: { is: TestComp2, props: {}, title: 'Terminal 2' },
//   Terminal3: { is: TestComp2, props: {}, title: 'Terminal 3' },
//   Terminal4: { is: TestComp2, props: {}, title: 'Terminal 4' },

//   Problems: { is: TestComp1, props: {}, title: 'Problems' },
//   Logs: { is: TestComp1, props: {}, title: 'Logs' },
//   DebugConsole: { is: TestComp2, props: {}, title: 'Debug Console' },
//   TestResults: { is: TestComp1, props: {}, title: 'Test Results' },
//   Coverage: { is: TestComp1, props: {}, title: 'Coverage' },

//   Inspector: { is: TestComp1, props: {}, title: 'Inspector' },
//   Outline: { is: TestComp1, props: {}, title: 'Outline' },
//   Symbols: { is: TestComp1, props: {}, title: 'Symbols' },

//   GitStatus: { is: TestComp1, props: {}, title: 'Git Status' },
//   GitHistory: { is: TestComp1, props: {}, title: 'Git History' },

//   CIStatus: { is: TestComp1, props: {}, title: 'CI Status' },
//   Deployments: { is: TestComp1, props: {}, title: 'Deployments' },
//   Metrics: { is: TestComp1, props: {}, title: 'Metrics' },

//   Notifications: { is: TestComp1, props: {}, title: 'Notifications' },
//   Tasks: { is: TestComp1, props: {}, title: 'Tasks' },
//   Calendar: { is: TestComp1, props: {}, title: 'Calendar' },

//   Documentation: { is: TestComp1, props: {}, title: 'Documentation' },
//   Scratchpad: { is: TestComp2, props: {}, title: 'Scratchpad' },
//   KnowledgeBase: { is: TestComp1, props: {}, title: 'Knowledge Base' },
// }

// const layout = ref<LayoutNode>({
//   type: 'group',
//   id: crypto.randomUUID(),
//   direction: 'row',
//   children: [
//     {
//       type: 'group',
//       id: crypto.randomUUID(),
//       direction: 'column',
//       initialSizeBias: 0.15,
//       children: [
//         { type: 'element', id: 'NavigationTree' },
//         { type: 'element', id: 'ProjectExplorer' },
//         { type: 'element', id: 'Bookmarks' },
//         { type: 'element', id: 'SearchResults' },
//       ],
//     },

//     {
//       type: 'group',
//       id: crypto.randomUUID(),
//       direction: 'column',
//       initialSizeBias: 0.55,
//       children: [
//         {
//           type: 'group',
//           id: crypto.randomUUID(),
//           direction: 'row',
//           children: [
//             {
//               type: 'group',
//               id: crypto.randomUUID(),
//               direction: 'column',
//               children: [
//                 { type: 'element', id: 'Editor1' },
//                 { type: 'element', id: 'Editor2' },
//                 { type: 'element', id: 'Editor3' },
//               ],
//             },

//             {
//               type: 'group',
//               id: crypto.randomUUID(),
//               direction: 'column',
//               children: [
//                 { type: 'element', id: 'Preview' },
//                 { type: 'element', id: 'APIReference' },
//               ],
//             },

//             {
//               type: 'group',
//               id: crypto.randomUUID(),
//               direction: 'column',
//               children: [
//                 { type: 'element', id: 'AIChat' },
//                 { type: 'element', id: 'PromptLibrary' },
//                 { type: 'element', id: 'ModelInspector' },
//               ],
//             },
//           ],
//         },

//         {
//           type: 'group',
//           id: crypto.randomUUID(),
//           direction: 'row',
//           children: [
//             { type: 'element', id: 'Terminal1' },
//             { type: 'element', id: 'Terminal2' },
//             { type: 'element', id: 'Terminal3' },
//             { type: 'element', id: 'Terminal4' },
//           ],
//         },

//         {
//           type: 'group',
//           id: crypto.randomUUID(),
//           direction: 'row',
//           children: [
//             { type: 'element', id: 'Problems' },
//             { type: 'element', id: 'Logs' },
//             { type: 'element', id: 'DebugConsole' },
//             { type: 'element', id: 'TestResults' },
//             { type: 'element', id: 'Coverage' },
//           ],
//         },
//       ],
//     },

//     {
//       type: 'group',
//       id: crypto.randomUUID(),
//       direction: 'column',
//       initialSizeBias: 0.3,
//       children: [
//         {
//           type: 'group',
//           id: crypto.randomUUID(),
//           direction: 'row',
//           children: [
//             { type: 'element', id: 'Inspector' },
//             { type: 'element', id: 'Outline' },
//             { type: 'element', id: 'Symbols' },
//           ],
//         },

//         {
//           type: 'group',
//           id: crypto.randomUUID(),
//           direction: 'column',
//           children: [
//             {
//               type: 'group',
//               id: crypto.randomUUID(),
//               direction: 'row',
//               children: [
//                 { type: 'element', id: 'GitStatus' },
//                 { type: 'element', id: 'GitHistory' },
//               ],
//             },

//             {
//               type: 'group',
//               id: crypto.randomUUID(),
//               direction: 'row',
//               children: [
//                 { type: 'element', id: 'CIStatus' },
//                 { type: 'element', id: 'Deployments' },
//                 { type: 'element', id: 'Metrics' },
//               ],
//             },
//           ],
//         },

//         {
//           type: 'group',
//           id: crypto.randomUUID(),
//           direction: 'row',
//           children: [
//             {
//               type: 'group',
//               id: crypto.randomUUID(),
//               direction: 'column',
//               children: [
//                 { type: 'element', id: 'Notifications' },
//                 { type: 'element', id: 'Tasks' },
//                 { type: 'element', id: 'Calendar' },
//               ],
//             },

//             {
//               type: 'group',
//               id: crypto.randomUUID(),
//               direction: 'column',
//               children: [
//                 { type: 'element', id: 'Documentation' },
//                 { type: 'element', id: 'Scratchpad' },
//                 { type: 'element', id: 'KnowledgeBase' },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   ],
// })

const panes: PaneDefinition = {
  NavigationTree: { is: TestComp1, props: {}, title: 'Navigation Tree' },
  ProjectExplorer: { is: TestComp1, props: {}, title: 'Project Explorer' },
  CodeEditor: { is: TestComp2, props: {}, title: 'Code Editorrrrrrrrrrrrrrrrrrrrrrrrrr' },
  Terminal: { is: TestComp2, props: {}, title: 'Terminal' },
  Inspector: { is: TestComp1, props: {}, title: 'Inspector' },
  ChatAssistant: { is: TestComp1, props: {}, title: 'Chat Assistant' },
}

const layout = ref<LayoutNode>({
  type: 'group',
  id: crypto.randomUUID(),
  direction: 'row',
  children: [
    {
      type: 'group',
      id: crypto.randomUUID(),
      direction: 'column',
      initialSizeBias: 0.2,
      children: [
        { type: 'element', id: 'NavigationTree' },
        { type: 'element', id: 'ProjectExplorer' },
      ],
    },

    {
      type: 'group',
      id: crypto.randomUUID(),
      direction: 'column',
      initialSizeBias: 0.6,
      children: [
        { type: 'element', id: 'CodeEditor' },
        { type: 'element', id: 'Terminal' },
      ],
    },

    {
      type: 'group',
      id: crypto.randomUUID(),
      direction: 'column',
      initialSizeBias: 0.2,
      children: [
        { type: 'element', id: 'Inspector' },
        { type: 'element', id: 'ChatAssistant' },
      ],
    },
  ],
})

// const layout = ref<LayoutNode>({
//   type: 'group',
//   id: crypto.randomUUID(),
//   direction: 'row',
//   initialSizeBias: 0.25,
//   children: [
//     { type: 'element', id: 'TestComp1' },
//     {
//       type: 'group',
//       id: crypto.randomUUID(),
//       direction: 'column',
//       children: [
//         { type: 'element', id: 'TestComp2' },
//         { type: 'element', id: 'TestComp2FunnyNamed' },
//       ],
//     },
//   ],
// })
// const layout = ref<LayoutNode>({
//   type: 'element', id: 'TestComp2FunnyNamed'
// })
</script>

<style scoped>
main {
  height: 100dvh;
}
</style>
