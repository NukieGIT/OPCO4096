import type { LayoutNode, GroupElement, Group, GroupDirection } from '@/components/tileable-layout/types'

export type NodeLocation = {
  parent: Group | null
  index: number
  node: LayoutNode
}

export type ValidatedNodeLocation = NodeLocation & {
  parent: Group
}

export function isNodeLocationValidated(loc: NodeLocation): loc is ValidatedNodeLocation {
  return loc.parent !== null
}

export function findNodeLocation(
  root: LayoutNode,
  id: string,
  parent: Group | null = null,
  index: number = 0,
): NodeLocation | null {
  if (root.id === id) {
    return { parent, index, node: root }
  }
  if (root.type !== 'group') return null

  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i]
    if (!child) continue
    const childLoc = findNodeLocation(child, id, root, i)
    if (childLoc) {
      return childLoc
    }
  }

  return null
}

export enum NodeManageResult {
  SUCCESS,
  NODE_LOCATION_NOT_FOUND,
  NODE_HAS_NO_PARENT,
  SAME_PARENT_AND_INDEX,
  DIFFERENT_DIRECTION,
  CANNOT_REMOVE_GROUP_NODE,
  UNEXPECTED_ERROR,
}

type CanPerformSuccess<T> = {
  result: NodeManageResult.SUCCESS
  locs: T
}

type CanPerformFailure = {
  result: Exclude<NodeManageResult, NodeManageResult.SUCCESS>
  locs: null
}

type CanPerformResult<T> = CanPerformSuccess<T> | CanPerformFailure

export function canSwapNodes(root: LayoutNode, nodeId1: string, nodeId2: string): CanPerformResult<[ValidatedNodeLocation, ValidatedNodeLocation]> {
  const node1Loc = findNodeLocation(root, nodeId1)
  const node2Loc = findNodeLocation(root, nodeId2)

  if (!node1Loc || !node2Loc) {
    return { result: NodeManageResult.NODE_LOCATION_NOT_FOUND, locs: null }
  }

  if (!isNodeLocationValidated(node1Loc) || !isNodeLocationValidated(node2Loc)) {
    return { result: NodeManageResult.NODE_HAS_NO_PARENT, locs: null }
  }

  if (node1Loc.parent === node2Loc.parent && node1Loc.index === node2Loc.index) {
    return { result: NodeManageResult.SAME_PARENT_AND_INDEX, locs: null }
  }

  return { result: NodeManageResult.SUCCESS, locs: [node1Loc, node2Loc] }
}

export function swapNodes(root: LayoutNode, nodeId1: string, nodeId2: string): NodeManageResult {
  const canSwapData = canSwapNodes(root, nodeId1, nodeId2)

  if (canSwapData.result !== NodeManageResult.SUCCESS) {
    return canSwapData.result
  }

  const [node1Loc, node2Loc] = canSwapData.locs

  const temp = node1Loc.parent.children[node1Loc.index]!
  node1Loc.parent.children[node1Loc.index] = node2Loc.parent.children[node2Loc.index]!
  node2Loc.parent.children[node2Loc.index] = temp
  return NodeManageResult.SUCCESS
}

export function canAddNode(
  root: LayoutNode,
  targetId: string,
  direction: GroupDirection,
): CanPerformResult<ValidatedNodeLocation | NodeLocation> {
  const targetLoc = findNodeLocation(root, targetId)

  if (!targetLoc) {
    return { result: NodeManageResult.NODE_LOCATION_NOT_FOUND, locs: null }
  }


  if (targetLoc.node.type === 'element') {
    if (!isNodeLocationValidated(targetLoc)) {
      return { result: NodeManageResult.NODE_HAS_NO_PARENT, locs: null }
    }
    return { result: NodeManageResult.SUCCESS, locs: targetLoc }
  }

  if (targetLoc.node.type === 'group' && targetLoc.node.direction === direction) {
    return { result: NodeManageResult.SUCCESS, locs: targetLoc }
  }

  return { result: NodeManageResult.DIFFERENT_DIRECTION, locs: null }
}

export function addNode(
  root: LayoutNode,
  targetId: string,
  index: number,
  direction: GroupDirection,
  newNode: LayoutNode,
): NodeManageResult {
  const canAddNodeResult = canAddNode(root, targetId, direction)

  if (canAddNodeResult.result !== NodeManageResult.SUCCESS) {
    return canAddNodeResult.result
  }

  const targetLoc = canAddNodeResult.locs

  if (targetLoc.node.type === 'element') {
    const newGroup: Group = {
      type: 'group',
      id: crypto.randomUUID(),
      direction: direction,
      children: index <= 0 ? [newNode, targetLoc.node] : [targetLoc.node, newNode],
    }
    // canAddNode guarantees that targetLoc is validated when the node is an element
    targetLoc.parent!.children[targetLoc.index] = newGroup
  } else if (targetLoc.node.type === 'group') {
    targetLoc.node.children.splice(index, 0, newNode)
  }
  return NodeManageResult.SUCCESS
}

export function canRemoveNode(root: LayoutNode, targetId: string): CanPerformResult<[ValidatedNodeLocation, NodeLocation | null]> {
  const targetLoc = findNodeLocation(root, targetId)

  if (!targetLoc) {
    return { result: NodeManageResult.NODE_LOCATION_NOT_FOUND, locs: null }
  }

  if (!isNodeLocationValidated(targetLoc)) {
    return { result: NodeManageResult.NODE_HAS_NO_PARENT, locs: null }
  }

  if (targetLoc.node.type === 'group') {
    return { result: NodeManageResult.CANNOT_REMOVE_GROUP_NODE, locs: null }
  }

  if (targetLoc.parent.children.length === 2) {
    const targetParentLoc = findNodeLocation(root, targetLoc.parent.id)

    if (!targetParentLoc) {
      return { result: NodeManageResult.NODE_LOCATION_NOT_FOUND, locs: null }
    }

    return { result: NodeManageResult.SUCCESS, locs: [targetLoc, targetParentLoc] }
  } else if (targetLoc.parent.children.length < 2) {
    console.error('Unexpected layout state: parent has less than 2 children when trying to remove a node')
    return { result: NodeManageResult.UNEXPECTED_ERROR, locs: null }
  }

  return { result: NodeManageResult.SUCCESS, locs: [targetLoc, null] }
}

export function removeNode(root: LayoutNode, targetId: string): NodeManageResult {
  const canRemoveNodeResult = canRemoveNode(root, targetId)

  if (canRemoveNodeResult.result !== NodeManageResult.SUCCESS) {
    return canRemoveNodeResult.result
  }

  const [targetLoc, targetParentLoc] = canRemoveNodeResult.locs

  if (targetLoc.node.type === 'element') {
    if (targetLoc.parent.children.length > 2) {
      targetLoc.parent.children.splice(targetLoc.index, 1)
    } else if (targetLoc.parent.children.length === 2) {
      // If the parent only has two children, then we can place the sibling in its place
      const sibling = targetLoc.parent.children[1 - targetLoc.index]!

      // canRemoveNode guarantees that targetParentLoc is not null when there is 1 or 2 children
      if (targetParentLoc!.parent === null) {
        // If the parent has no parent, we are removing a child from the root
        Object.assign(root, sibling)
      } else {
        targetParentLoc!.parent.children[targetParentLoc!.index] = sibling
      }
    } else {
      // This should never happen
      console.error('Unexpected layout state: parent has no children when trying to remove a node')
      return NodeManageResult.UNEXPECTED_ERROR
    }
  }

  return NodeManageResult.SUCCESS
}

export function canMoveNode(
  root: LayoutNode,
  fromId: string,
  toId: string,
  direction: GroupDirection,
): CanPerformResult<[NodeLocation, NodeLocation]> {
  const fromLoc = findNodeLocation(root, fromId)
  const toLoc = findNodeLocation(root, toId)

  if (!fromLoc || !toLoc) {
    return { result: NodeManageResult.NODE_LOCATION_NOT_FOUND, locs: null }
  }

  const canRemoveNodeResult = canRemoveNode(root, fromId)
  if (canRemoveNodeResult.result !== NodeManageResult.SUCCESS) {
    return { result: canRemoveNodeResult.result, locs: null }
  }

  const canAddNodeResult = canAddNode(root, toId, direction)
  if (canAddNodeResult.result !== NodeManageResult.SUCCESS) {
    return { result: canAddNodeResult.result, locs: null }
  }

  return { result: NodeManageResult.SUCCESS, locs: [fromLoc, toLoc] }
}

export function moveNode(
  root: LayoutNode,
  fromId: string,
  toId: string,
  index: number,
  direction: GroupDirection,
): NodeManageResult {
  const canMoveNodeResult = canMoveNode(root, fromId, toId, direction)

  if (canMoveNodeResult.result !== NodeManageResult.SUCCESS) {
    return canMoveNodeResult.result
  }

  const [fromLoc] = canMoveNodeResult.locs

  removeNode(root, fromId)
  addNode(root, toId, index, direction, fromLoc.node)

  return NodeManageResult.SUCCESS
}
