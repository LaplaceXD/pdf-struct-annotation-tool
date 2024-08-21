import type { Line } from "./types";

/**
 * Increment indentation to a target line.
 *
 * @param linesList - The array of objects.
 * @param target - The index of the line to apply the indentation.
 * @returns The array of objects with the indentation applied.
 */
export function incrementIndent(linesList: Line[], target: number): Line[] {
  // Can't indent the first line
  if (target === 0) return linesList;

  // Pure function operation
  const lines = [...linesList];

  // Retrieve the parent of the target, after applying the indentation
  //
  // 1. Line <-- parent
  //    1.1 Line 2
  // 2. Line <-- indenting this line
  //
  // The parent should currently be the nearest line with the same indentation level
  let parent = target - 1;
  while (lines[parent].indent > lines[target].indent) {
    parent = lines[parent].parent;
  }

  // The parent should now be an indented block transition
  lines[parent].label = "d";
  lines[target].label = "s";

  // Retrieve the adjacent nodes
  const prevNode = target - 1;
  const nextNode = target + 1;

  // Look at the indentation differences between the target
  // and the previous node
  //
  // Case 1: One level diff
  // 1. Line 1
  //   1.1 Line 2 <-- prev node (pointer: -1)
  // 2. Line 3 <-- indenting this line
  //
  // After the operation:
  // 1. Line 1
  //  1.1 Line 2 <-- prev node (pointer: 0)
  //  2. Line 3 <-- active line (pointer: -1)
  //
  // Case 2: Move than one level diff
  // 1. Line 1
  //  1.1 Line 2
  //    1.1.1 Line 3 <-- prev node (pointer: -1)
  // 2. Line 4 <-- indenting this line
  //
  // After the operation:
  // 1. Line 1
  //  1.1 Line 2
  //    1.1.1 Line 3 <-- prev node (pointer: 1)
  //  2. Line 4 <-- active line (pointer: -1)
  if (lines[prevNode].indent - lines[target].indent <= 1) {
    // Case 1, one level diff, the target now holds the transition pointer
    // while the previous node is unset
    lines[prevNode].pointer = 0;
  } else {
    // Case 2, more than one level diff, the previous node
    // will point to the parent of the indented line
    lines[prevNode].pointer = parent + 1; // pointers are 1-indexed, parents are 0-indexed
  }

  // Look at the parent of the next node to determine,
  // the transition pointer of the active line to the next
  //
  // Case 1: Next node is a child of the target
  // 1. Line 1
  // 2. Line 2 <-- active line (pointer: 0)
  //  2.1 Line 3 <-- next node
  //
  // After the operation:
  // 1. Line 1
  //  2. Line 2 <-- active line (pointer: 0)
  //    2.1 Line 3 <-- nextNode
  //
  // Case 2: Next node has a root parents
  // 1. Line 1
  //  1.1 Line 2
  // 2. Line 3 <-- active line
  // 3. Line 4 <-- next node (parent: -1)
  //
  // After the operation:
  // 1. Line 1
  //  1.1 Line 2
  //  2. Line 3 <-- active line (pointer: -1)
  // 4. Line 4 <-- next node
  //
  // Case 3: Next node has a parent
  // 1. Line 1
  //  1.1 Line 2
  //    1.1.1 Line 3
  //  1.2 Line 4 <-- target
  //  1.3 Line 5 <-- next node (parent: 1)
  //
  // After the operation:
  // 1. Line 1
  //  1.1 Line 2
  //    1.1.1 Line 3
  //    1.2 Line 4 <-- target (pointer: 2) <-- pointers are 1-indexed, parents 0-indexed
  //  1.3 Line 5 <-- next node
  if (nextNode < lines.length) {
    if (lines[nextNode].indent > lines[target].indent) {
      // Next node is a child of the target
      lines[target].pointer = 0;
    } else if (lines[nextNode].parent === -1) {
      // Next sibling has a root parent
      lines[target].pointer = -1;
    } else {
      // Next sibling has a non-root parent, account for index difference
      lines[target].pointer = lines[nextNode].parent + 1;
    }
  }

  return calculateIndent(lines);
}

export function decrementIndent(linesList: Line[], target: number): Line[] {
  // Can't remove indentation from the first line
  if (target === 0) return linesList;

  // Pure function operation
  const lines = [...linesList];

  // Retrieve the current parent of the target, and the grandparent
  // the grandparent will be the new parent after the operation
  const parent = lines[target].parent;
  if (parent === -1) return linesList; // Already at root level

  const grandParent = lines[parent].parent;

  // Retrieve the adjacent nodes
  const prevNode = target - 1;
  const nextNode = target + 1;

  // Look at the indentation differences between the target
  // and the previous node
  //
  // Case 1: Prev node is the parent node
  // 1. Line 1 <-- prev node (label: "d")
  //  1.1 Line 2 <-- target
  //    1.1.1 Line 3 <-- next node (pointer: 1)
  //  1.2 Line 4
  //
  // After the operation:
  // 1. Line 1 <-- prev node (label: "s")
  // 1.1 Line 2 <-- target (label: "d") <-- replaces the previous node as parent
  //  1.1.1 Line 3 <-- next node (pointer: 0)
  //  1.2 Line 4
  //
  // Case 2: Prev node is a sibling or a deeper indented node
  // 1. Line 1
  //  1.1 Line 2 <-- grandparent
  //    1.1.1 Line 3 <-- parent
  //      1.1.1.1 Line 4 <-- prev node (pointer: 3)
  //    1.2 Line 4 <-- target
  //
  // After the operation:
  // 1. Line 1
  //  1.1 Line 2 <-- grandparent
  //    1.1.1 Line 3 <-- parent
  //      1.1.1.1 Line 4 <-- prev node (pointer: 2) <-- adjusted to grandparent
  //  1.2 Line 4 <-- target
  if (lines[prevNode].indent < lines[target].indent) {
    lines[prevNode].label = "s";

    // Check if the prevNode has more than one children
    if (lines.filter((line) => line.parent === parent).length > 1) {
      lines[target].label = "d";

      console.log("HELLO!");

      for (let i = target + 1; i < lines.length; ++i) {
        // Since the children of the current node will be merged with the children
        // of the previous parent, we need to unset the pointer of middle children
        if (lines[i].parent === target && lines[i].pointer === prevNode + 1) {
          lines[i].pointer = 0;
        }

        // Point all the nodes pointing to the previous node to the target node
        if (lines[i].pointer !== 0 && lines[i].pointer === prevNode + 1) {
          lines[i].pointer = target + 1;
        }
      }
    }
  } else {
    lines[prevNode].pointer = grandParent === -1 ? -1 : grandParent + 1;
  }

  // Look at the indentation differences between the target
  // and the next node
  //
  // Case 1: More than one indentation diff between the target and the next node
  // 1. Line 1
  //  1.1 Line 2
  //    1.1.1 Line 3 <-- target (pointer: 1)
  // 2. Line 4 <-- next node (parent: -1)
  //
  // After the operation:
  // 1. Line 1
  //  1.1 Line 2
  //  1.2 Line 3 <-- target (pointer: -1)
  // 2. Line 4 <-- next node
  //
  // For other cases, the target will just be on the same indentation level,
  // so just unset the pointer
  if (nextNode < lines.length) {
    if (lines[target].indent - lines[nextNode].indent > 1) {
      lines[target].pointer =
        lines[nextNode].parent === -1 ? -1 : lines[nextNode].parent + 1;
    } else {
      lines[target].pointer = 0;
    }
  }

  return calculateIndent(lines);
}

/**
 * Calculate the indentation level of each line.
 *
 * @param lines - The array of objects.
 * @returns The array of objects with the indentation level.
 */
export function calculateIndent(lines: Line[]): Line[] {
  // Calculate the indentation level.
  return lines.map((line, i, lines) => {
    // The first line has no pointer, just return as is.
    if (i === 0) return line;

    const prevLine = lines[i - 1];

    if (prevLine.pointer === -1) {
      // If the previous line points to -1 (root)
      // then the current line has 0 indentation and no parent
      line.indent = 0;
      line.parent = -1;
    } else if (prevLine.pointer !== 0) {
      // If the previous line points has a set pointer,
      // then set the indent of the current line to the pointed line's indent + 1
      // and set the parent to the pointed line.
      // Note: not quite sure if it's possible to have a 's' label with a pointer
      line.indent = lines[prevLine.pointer - 1].indent + 1;
      line.parent = prevLine.pointer - 1;
    } else if (prevLine.label === "d") {
      // If the previous line transitions the current line to an indented block
      // then set the current line's indent to the previous line's indent + 1
      // and set the parent to the previous line.
      line.indent = prevLine.indent + 1;
      line.parent = i - 1;
    } else {
      // Any other label 'c', 's', ... will have the same indentation level
      // as the previous line and the same parent
      line.indent = prevLine.indent;
      line.parent = prevLine.parent;
    }

    return line;
  });
}
