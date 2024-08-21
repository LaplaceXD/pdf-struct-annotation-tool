export type Line = {
  /**
   * The text content of the Line
   */
  text: string;
  /**
   * Tells the line to where the next line is nested under as an indent block.
   * This is 1-indexed. -1 for root, 0 for unset.
   */
  pointer: number;
  /**
   * The transition label of the line to the next line.
   * For full explanation, see:
   * https://github.com/stanfordnlp/pdf-struct?tab=readme-ov-file#annotating-tsv-files
   */
  label: "c" | "d" | "s" | "x" | "e" | "";
  /**
   * The indentation level of the line.
   */
  indent: number;
  /**
   * Internal variable to keep track of the parent of the current line in an indent block.
   * This is 0-indexed, -1 is used for root.
   */
  parent: number;
};
