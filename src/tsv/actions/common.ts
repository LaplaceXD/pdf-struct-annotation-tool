import { Line } from "../types";
import { calculateIndent } from "../utils";

/**
 * Responsible for updating the pointers of the child lines.
 *
 * @example
 * 1. Line 1 <-- (label: 'd') -> transition this to a non 'd' label
 *   1.1 Line 2
 *     1.1.1 Line 3
 *   1.2 Line 4
 *     1.2.1 Line 5
 *
 * After the operation:
 * 1. Line 1 <-- (label: 's')
 * 1.1 Line 2
 *   1.1.1 Line 3
 * 1.2 Line 4
 *   1.2.1 Line 5
 *
 * Item indentations are preserved.
 *
 * @param lines - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with updated pointers.
 */
function updateChildPointers(lines: Line[], target: number): Line[] {
  const parent = lines[target].parent;

  for (let i = target + 1; i < lines.length; i++) {
    // If the current line points to the target,
    // update the pointer to the target's parent
    if (lines[i].pointer === target + 1) {
      lines[i].pointer = parent === -1 ? -1 : parent + 1;
    }

    // If the child is a direct child of the target, and has an indent of 1
    // which means after the operation it would be shifted to the root level
    // unset the pointer
    if (lines[i].parent === target && lines[i].indent === 1) {
      lines[i].pointer = 0;
    }
  }

  return lines;
}

/**
 * Responsible for inserting a new line after the target.
 *
 * @param linesList - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the new line inserted.
 */
export function insertNewLine(linesList: Line[], target: number) {
  // This is a pure function
  const lines = [...linesList];

  // If this is an indented block
  if (lines[target].label === "d") {
    // Update the pointers of the child lines
    updateChildPointers(lines, target);
  }

  // Set transition label
  lines[target].label = "s";

  return calculateIndent(lines);
}

/**
 * Responsible for deleting a line.
 *
 * @param linesList - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the line deleted.
 */
export function deleteLine(linesList: Line[], target: number) {
  // This is a pure function
  const lines = [...linesList];

  // If this is an indented block
  if (lines[target].label === "d") {
    // Update the pointers of the child lines
    updateChildPointers(lines, target);
  }

  // Set transition label
  lines[target].label = "e";

  return calculateIndent(lines);
}

/**
 * Responsible for excluding the line from the dataset.
 *
 * @param linesList - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the line excluded.
 */
export function excludeLine(linesList: Line[], target: number) {
  // This is a pure function
  const lines = [...linesList];

  // If this is an indented block
  if (lines[target].label === "d") {
    // Update the pointers of the child lines
    updateChildPointers(lines, target);
  }

  // Set transition label
  lines[target].label = "x";

  return calculateIndent(lines);
}

/**
 * Responsible for joining the target with the previous line.
 *
 * @param linesList - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the backspace operation applied.
 */
export function backspace(linesList: Line[], target: number) {
  if (target === 0) return linesList;

  // This is a pure function
  const lines = [...linesList];

  // Backspace operation is applied to the previous node, since the previous node
  // dictates the transition label to this node
  const prevNode = target - 1;

  // If the previous node is an indented block
  if (lines[prevNode].label === "d") {
    // Update the pointers of the child lines
    updateChildPointers(lines, prevNode);
  }

  // Set transition label of hte previous node
  lines[prevNode].label = "c";

  // If the target node has a lower indent level than the previous node
  if (lines[target].indent < lines[prevNode].indent) {
    // The target node should now hold the pointer of the previous node
    // to ensure that they have the same indentation level
    lines[target].pointer = lines[prevNode].pointer;
    lines[prevNode].pointer = 0;
  }

  // Other cases, are already accounted for when the indentation is calculated

  return calculateIndent(lines);
}
