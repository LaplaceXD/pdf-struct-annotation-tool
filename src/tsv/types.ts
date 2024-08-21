export type Line = {
  text: string;
  pointer: number; // 1-indexed, -1 for root, 0 for unset
  parent: number; // 0-indexed, -1 for root
  label: "c" | "d" | "s" | "";
  indent: number;
};
