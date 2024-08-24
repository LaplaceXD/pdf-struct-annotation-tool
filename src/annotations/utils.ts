import type { Line } from "./types";

/**
 * Parse a TSV file into an array of objects.
 *
 * @param file - The TSV file to parse.
 * @returns The array of objects.
 */
export async function parseTsvToLines(file: File): Promise<Line[]> {
  const contents = await file.text();

  const formattedContent = contents
    // Split the text into lines.
    .split("\n")
    // Remove "/r/n" from the end of each line.
    .map((line) => line.trimEnd())
    // Remove empty lines.
    .filter((line) => !!line)
    // Convert each line into an object.
    .map((line) => {
      // Split the line by tabs to get the text, pointer, and label.
      const [text, pointer, label] = line.split("\t");

      return {
        text,
        pointer: parseInt(pointer),
        label: label as Line["label"],
        indent: 0,
      } satisfies Line;
    });

  return calculateIndentFromPointers(formattedContent);
}

/**
 * Save the array of objects to a TSV file.
 *
 * @param lines - The array of objects.
 * @returns nothing
 */
export function saveLinesToTsv(lines: Line[]): void {
  const content = lines
    // Tab separate the values
    .map((line) => {
      return `${line.text}\t${line.pointer}\t${line.label}`;
    })
    // Join the lines with a newline
    .join("\n");

  // Create a blob with the content
  const blob = new Blob([content], { type: "text/plain" });
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Create an anchor element to download the file
  const a = document.createElement("a");
  a.href = url;
  a.download = "output.tsv";
  a.click();

  // Revoke the URL
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

    if (prevLine.label === "d") {
      // Indent increases for every indent block transition labels found
      indent++;
    } else if (prevLine.pointer > 0) {
      // If the previous line has a pointer, then use the indentation level of the line
      // being pointed to.
      indent = lines[prevLine.pointer - 1].indent + 1;
    } else if (prevLine.pointer === -1) {
      // If the previous line has a pointer of -1, then it is a root line, reset the indent
      indent = 0;
    }

    line.indent = indent;
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
  // Stack to keep track of the pointers encountered for the current depth
  const pointers = [];

  for (let i = 1; i < lines.length; ++i) {
    const line = lines[i - 1];
    const nextLine = lines[i];

    if (line.indent === nextLine.indent) {
      // If next line has the same indentation level
      // then unset the pointer
      line.pointer = 0;
      // Reset the label for previously indented blocks that now have no children
      line.label = line.label === "d" ? "s" : line.label;
    } else if (line.indent < nextLine.indent) {
      // If next line is indented, then this line is an indented block
      // indented block are labeled as "d", and will have unset pointers
      line.pointer = 0;
      line.label = "d";

      // Push this line to the stack of pointers, since it is a parent indent block
      // keep in mind that the current line index is i - 1, but we are
      // pushing i, since the pointers are 1-indexed
      pointers.push(i);
    } else {
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
        pointers.pop();
      }

      // Set the pointer to the last pointer in the stack, or -1 if the stack is empty
      line.pointer = pointers.length === 0 ? -1 : pointers[pointers.length - 1];
    }
  }

  return lines;
}
