import type { Line } from "./types";
import { updatePointersFromIndent } from "./utils";

/**
 * Decrement the indentation of children lines of a target line,
 * if the target line is an indented block transition.
 *
 * @param lines - The array of objects.
 * @param target - The index of the line to apply the indentation.
 * @returns The array of objects with the indentation applied.
 */
function decrementChildIndent(lines: Line[], target: number) {
  // This only works if the target is an indented block transition
  if (lines[target].label !== "d") return lines;

  for (
    let i = target + 1;
    i < lines.length && lines[i].indent > lines[target].indent;
    ++i
  ) {
    --lines[i].indent;
  }

  return updatePointersFromIndent(lines);
}

/**
 * Increment indentation to a target line.
 *
 * @param lines - The array of objects.
 * @param target - The index of the line to apply the indentation.
 * @returns The array of objects with the indentation applied.
 */
export function incrementIndent(lines: Line[], target: number): Line[] {
  if (
    // Can't indent the first line
    target === 0 ||
    // Can only indent if the previous line has the same or less indentation
    lines[target - 1].indent < lines[target].indent
  )
    return lines;

  ++lines[target].indent;
  lines[target].label = "s";

  return updatePointersFromIndent(lines);
}

/**
 * Decrement indentation of a target line.
 *
 * @param lines - The array of objects.
 * @param target - The index of the line to apply the indentation.
 * @returns The array of objects with the indentation applied.
 */
export function decrementIndent(lines: Line[], target: number): Line[] {
  if (
    // Can't decrement the first line
    target === 0 ||
    // Target line is already at root indentation level
    lines[target].indent === 0
  )
    return lines;

  // Decrement the indentation of children lines
  lines = decrementChildIndent(lines, target);

  --lines[target].indent;
  lines[target].label = "s";

  return updatePointersFromIndent(lines);
}

/**
 * Responsible for inserting a new line after the target.
 *
 * @param lines - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the new line inserted.
 */
export function insertNewLine(lines: Line[], target: number) {
  // Decrement the indentation of children lines, if the target is an indented block
  lines = decrementChildIndent(lines, target);
  // Set transition label
  lines[target].label = "s";

  return lines;
}

/**
 * Responsible for deleting a line.
 *
 * @param lines - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the line deleted.
 */
export function deleteLine(lines: Line[], target: number) {
  // Decrement the indentation of children lines, if the target is an indented block
  lines = decrementChildIndent(lines, target);
  // Set transition label
  lines[target].label = "e";

  return lines;
}

/**
 * Responsible for excluding the line from the dataset.
 *
 * @param lines - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the line excluded.
 */
export function excludeLine(lines: Line[], target: number) {
  // Decrement the indentation of children lines, if the target is an indented block
  lines = decrementChildIndent(lines, target);
  // Set transition label
  lines[target].label = "x";

  return lines;
}

/**
 * Responsible for joining the target with the next line.
 *
 * @param lines - The array of objects.
 * @param target - The index of the target line.
 * @returns The array of objects with the backspace operation applied.
 */
export function backspace(lines: Line[], target: number) {
  // Decrement the indentation of children lines, if the target is an indented block
  lines = decrementChildIndent(lines, target);
  // Set transition label
  lines[target].label = "c";

  // Since this line and the next line are being joined, they should have the same indentation
  if (
    target + 1 < lines.length &&
    lines[target + 1].indent !== lines[target].indent
  ) {
    lines[target + 1].indent = lines[target].indent;
    lines = updatePointersFromIndent(lines);
  }

  return lines;
}
