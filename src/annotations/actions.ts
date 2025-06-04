import { type Line, Transition } from "./types";
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
  if (lines[target].label !== Transition.INDENTED_BLOCK) return lines;

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
  const isFirstLine = target === 0;
  const isPreviousLineSameOrEqualIndent = lines[target - 1].indent <= lines[target].indent;
  if (isFirstLine || isPreviousLineSameOrEqualIndent) return lines;

  ++lines[target].indent;
  lines[target].label = Transition.SAME_LEVEL;

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
  const isFirstLine = target === lines.length - 1;
  const isLineAtRootIndent = lines[target].indent === 0;
  if (isFirstLine || isLineAtRootIndent) return lines;

  lines = decrementChildIndent(lines, target);

  --lines[target].indent;
  lines[target].label = Transition.SAME_LEVEL;

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
  lines = decrementChildIndent(lines, target);
  lines[target].label = Transition.SAME_LEVEL;

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
  lines = decrementChildIndent(lines, target);
  lines[target].label = Transition.DELETE;

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
  lines = decrementChildIndent(lines, target);
  lines[target].label = Transition.IGNORE;

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
  lines = decrementChildIndent(lines, target);
  lines[target].label = Transition.CONTINUOUS;

  const isTargetWithinLineBounds = target + 1 < lines.length;
  const isSameIndentAsNextLine = lines[target + 1].indent === lines[target].indent;

  if (isTargetWithinLineBounds && !isSameIndentAsNextLine) {
    lines[target + 1].indent = lines[target].indent;
    lines = updatePointersFromIndent(lines);
  }

  return lines;
}
