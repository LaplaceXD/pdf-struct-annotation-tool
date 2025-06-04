export enum Pointer {
  /**
    * Points to the root hierarchy of the document.
    */
  ROOT = -1,
  /**
   * The line is not pointing to any other line.
   */
  UNSET = 0,
}

/**
  * The full-names here does not follow the names highlighted in the README of 
  * @link https://github.com/stanfordnlp/pdf-struct?tab=readme-ov-file#annotating-tsv-files.
  * Instead, they are more descriptive of the actual transition.
  */
export enum Transition {
  /**
    * The next line is part of the same paragraph.
    */
  CONTINUOUS = "c",
  /**
   * The next line is part of the same paragraph, but the line break is meaningful (e.g., addresses).
   */
  ADDRESS = "a",
  /**
   * The next line is a start of a new paragraph, but within the same block.
   */
  BLOCK = "b",
  /**
   * The next line is a start of a new block (thus a new paragraph).
   */
  SAME_LEVEL = "s",
  /**
   * The next line is a start of a new block (thus a new paragraph) that is a child of the current block.
   */
  INDENTED_BLOCK = "d",
  /**
   * The current line should be deleted.
   */
  DELETE = "e",
  /**
   * The current line should be excluded both from training and evaluation.
   */
  IGNORE = "x",
}

export type Line = {
  /**
   * The text content of the Line
   */
  text: string;
  /**
   * Tells the line to where the next line is nested under as an indent block.
   */
  pointer: Pointer | (number & {});
  /**
   * The transition label of the line to the next line.
   * For full explanation, see:
   * https://github.com/stanfordnlp/pdf-struct?tab=readme-ov-file#annotating-tsv-files
   */
  label: Transition;
  /**
   * The indentation level of the line.
   */
  indent: number;
};
