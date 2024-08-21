import type { Line } from "./types";

/**
 * Parse a TSV file into an array of objects.
 *
 * @param file - The TSV file to parse.
 * @returns The array of objects.
 */
export async function parseTsvFile(file: File) {
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
        parent: -1,
      };
    });

  return calculateIndent(formattedContent);
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
