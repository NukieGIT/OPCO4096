import type { LayoutNode, GroupElement, Group, GroupDirection } from '@/components/tileable-layout/types'

export type NodeLocation = {
  parent: Group | null
  index: 0 | 1
  node: LayoutNode
}

export function findNodeLocation(
  root: LayoutNode,
  id: string,
  parent: Group | null = null,
  edge: 0 | 1 = 0,
): NodeLocation | null {
  if (root.id === id) {
    return { parent, index: edge, node: root }
  }

  if (root.type === 'split') {
    const left = findNodeLocation(root.children[0], id, root, 0)
    return left ?? findNodeLocation(root.children[1], id, root, 1)
  }

  return null
}

export function swapNodes(root: LayoutNode, fromId: string, toId: string) {
  const fromLoc = findNodeLocation(root, fromId)
  const toLoc = findNodeLocation(root, toId)

  if (!fromLoc || !toLoc || !fromLoc.parent || !toLoc.parent) {
    return
  }

  if (fromLoc.parent === toLoc.parent && fromLoc.index === toLoc.index) {
    console.warn('Attempted to swap a node with itself, ignoring.')
    return
  }

  const temp = fromLoc.parent.children[fromLoc.index]
  fromLoc.parent.children[fromLoc.index] = toLoc.parent.children[toLoc.index]
  toLoc.parent.children[toLoc.index] = temp
}

export function addNode(
  root: LayoutNode,
  targetId: string,
  edge: 0 | 1,
  direction: GroupDirection,
  newNode: LayoutNode,
) {
  const targetLoc = findNodeLocation(root, targetId)

  if (!targetLoc || !targetLoc.parent) {
    return
  }

  if (targetLoc.node.type === 'leaf') {
    const newSplit: Group = {
      type: 'split',
      id: crypto.randomUUID(),
      direction: direction,
      children: edge === 0 ? [newNode, targetLoc.node] : [targetLoc.node, newNode],
    }
    targetLoc.parent.children[targetLoc.index] = newSplit
    return
  }

  console.warn('Attempted to add a node to a non-leaf target, ignoring.')
}

export function removeNode(root: LayoutNode, targetId: string) {
  const targetLoc = findNodeLocation(root, targetId)

  if (!targetLoc || !targetLoc.parent) {
    return
  }

  if (targetLoc.node.type === 'leaf') {
    const sibling = targetLoc.parent.children[1 - targetLoc.index]!
    const parentLoc = findNodeLocation(root, targetLoc.parent.id)

    if (parentLoc && parentLoc.parent) {
      parentLoc.parent.children[parentLoc.index] = sibling
    } else {
      // If the parent is the root, we replace its contents with the sibling's contents
      if (sibling.type === 'leaf') {
        const leafRoot = root as GroupElement
        leafRoot.type = 'leaf'
        leafRoot.id = sibling.id
      } else {
        const splitRoot = root as Group
        splitRoot.type = 'split'
        splitRoot.id = sibling.id
        splitRoot.direction = sibling.direction
        splitRoot.children = sibling.children
      }
    }
  }
}

export function moveNode(
  root: LayoutNode,
  fromId: string,
  toId: string,
  edge: 0 | 1,
  direction: GroupDirection,
) {
  const fromLoc = findNodeLocation(root, fromId)
  const toLoc = findNodeLocation(root, toId)

  if (!fromLoc || !toLoc || !fromLoc.parent || !toLoc.parent) {
    return
  }

  if (fromLoc.parent === toLoc.parent && fromLoc.index === toLoc.index) {
    console.warn('Attempted to move a node onto itself, ignoring.')
    return
  }

  removeNode(root, fromId)
  addNode(root, toId, edge, direction, fromLoc.node)
}
