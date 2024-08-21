import type { Line } from "./types";

/**
 * Parse a TSV file into an array of objects.
 *
 * @param file - The TSV file to parse.
 * @returns The array of objects.
 */
export async function parseTsvFile(file: File) {
  const contents = await file.text();

  return (
    contents
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
      })
  );
}
