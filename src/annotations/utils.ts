import { type Line, Pointer, Transition } from "./types";

/**
 * Parse a TSV file into an array of objects.
 *
 * @param file - The TSV file to parse.
 * @returns The array of objects.
 */
export async function parseTsvToLines(file: File): Promise<Line[]> {
  const contents = await file.text();

  const formattedContent = contents
    .split("\n")
    .map((line) => line.replace(/[\r\n]+$/, ""))
    .filter((line) => !!line)
    .map((line) => {
      const [text, pointer, label] = line.split("\t");

      return {
        text,
        pointer: parseInt(pointer),
        label: isValidLabel(label) ? label : Transition.IGNORE,
        indent: 0,
      } satisfies Line;
    });

  return calculateIndentFromPointers(formattedContent);
}

/**
 * Check if the label is a valid Transition.
 *
 * @param label - The label to check.
 * @returns true if the label is a valid Transition, false otherwise.
 */
export function isValidLabel(label: string): label is Transition {
  return Object.values(Transition).includes(label as Transition);
}

/**
 * Save the array of objects to a TSV file.
 *
 * @param lines - The array of objects.
 * @param filename - The name of the file to save.
 * @returns nothing
 */
export function saveLinesToTsv(lines: Line[], filename: string): void {
  const content = lines
    .map((line) => `${line.text}\t${line.pointer}\t${line.label}`)
    .join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Calculate the indentation level of each line based on the pointers.
 *
 * @param lines - The array of objects.
 * @returns The array of objects with the indentation level.
 */
export function calculateIndentFromPointers(lines: Line[]): Line[] {
  let indent = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = lines[i - 1];

    if (prevLine.label === Transition.INDENTED_BLOCK) {
      indent++;
      line.indent = indent;

      continue
    }

    const doesPrevLineHavePointer = prevLine.pointer > 0;

    if (doesPrevLineHavePointer) {
      const commonParentLine = lines[prevLine.pointer - 1];
      line.indent = commonParentLine.indent + 1;
    } else if (line.pointer === Pointer.ROOT) {
      line.indent = 0;
    }
  }

  return lines;
}

/**
 * Update the pointer of each line accordingly based on
 * the indentation level.
 *
 * @param lines - The array of objects.
 * @returns The array of objects with the pointers updated.
 */
export function updatePointersFromIndent(lines: Line[]) {
  // Keep track of the pointers of indented block markers those mark with `Transition.INDENTED_BLOCK`
  const indentedBlockMarkers = [];

  for (let i = 1; i < lines.length; ++i) {
    const line = lines[i - 1];
    const nextLine = lines[i];

    const isSameIndentAsNext = line.indent === nextLine.indent;

    if (isSameIndentAsNext) {
      line.pointer = 0;
      line.label = line.label === Transition.INDENTED_BLOCK ? Transition.SAME_LEVEL : line.label;

      continue
    }

    const isNextLineIndented = nextLine.indent > line.indent;

    if (isNextLineIndented) {
      line.pointer = 0;
      line.label = Transition.INDENTED_BLOCK;
      indentedBlockMarkers.push(i);

      continue
    }

    // If next line is less indented, then pop the stack with their difference
    // in indentation levels to retrieve the correct parent to point to.
    //
    // Example:
    // 1. a
    //  2. b <-- last pointer in stack
    //    3. c
    //  4. d <-- next line has a lesser indent, and has an indent difference of 1
    //
    // Pop once as the difference is 1, which results in:
    // 1. a <-- last pointer in stack
    //  2. b
    //    3. c
    //  4. d
    for (let diff = line.indent - nextLine.indent; diff > 0; --diff) {
      indentedBlockMarkers.pop();
    }

    const lastIndentedBlockMarkerPointer = indentedBlockMarkers[indentedBlockMarkers.length - 1];

    line.pointer = indentedBlockMarkers.length === 0 ? Pointer.ROOT : lastIndentedBlockMarkerPointer;
  }

  return lines;
}
