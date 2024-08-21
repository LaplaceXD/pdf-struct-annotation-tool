import { clsx } from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

export default function App() {
  const [lines, setLines] = useState<Line[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const activeRef = useRef<HTMLLIElement>(null);

  const handleLineNavigation = useCallback(
    (direction: "up" | "down") => {
      if (direction === "up") {
        setActiveLine((activeLine) =>
          activeLine > 0 ? activeLine - 1 : activeLine,
        );
      } else if (direction === "down") {
        setActiveLine((activeLine) =>
          activeLine < lines.length - 1 ? activeLine + 1 : activeLine,
        );
      }

      activeRef.current?.scrollIntoView({
        behavior: "auto",
        block: "center",
        inline: "nearest",
      });
    },
    [lines, activeLine, setActiveLine],
  );

  const handleContinuous = useCallback(() => {
    if (activeLine === 0) return;

    const newLines = [...lines];
    newLines[activeLine - 1].label = "c";

    setLines(calculateIndent(newLines));
  }, [lines, activeLine, setLines]);

  const handleSameLevel = useCallback(() => {
    const newLines = [...lines];
    newLines[activeLine].label = "s";

    setLines(calculateIndent(newLines));
    setActiveLine((activeLine) => activeLine + 1);
  }, [lines, activeLine, setLines]);

  const handleIndent = useCallback(() => {
    if (activeLine === 0) return lines;

    const newLines = [...lines];

    // Retrieve the supposed parent of the active line, after applying the indentation
    // the parent should currently be the nearest line with the same indentation level
    // as the active line
    let parent = activeLine - 1;
    while (newLines[parent].indent > newLines[activeLine].indent) {
      parent = newLines[parent].parent;
    }

    // The parent should now be an indented block transition
    newLines[parent].label = "d";

    const prevSibling = activeLine - 1;
    // Look at the indentation differences of the active line
    // and the previous sibling
    if (newLines[prevSibling].indent - newLines[activeLine].indent > 1) {
      // If the difference is greater than 1 which means the previous sibling
      // will still be a level deeper than the active line after the operation
      // then the previous sibling will point to the parent of the active line
      newLines[prevSibling].pointer = parent + 1; // pointers are 1-indexed, parents are 0-indexed
    } else {
      // Otherwise, after the operation they would be the same level,
      // thus the current sibling now holds the transition pointer, and
      // the previous sibling is unset
      newLines[prevSibling].pointer = 0;
    }

    const nextSibling = activeLine + 1;
    // Look at the parent of the next sibling to determine,
    // the transition pointer of the active line to the next
    if (nextSibling < newLines.length) {
      if (newLines[nextSibling].parent === -1) {
        // Next sibling has a root parent
        newLines[activeLine].pointer = -1;
      } else {
        // Pointers are 1-indexed, parents are 0-indexed
        newLines[activeLine].pointer = newLines[nextSibling].parent + 1;
      }
    }

    setLines(calculateIndent(newLines));
  }, [lines, activeLine, setLines]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent the scrollbar from moving when using the arrow keys.
      e.preventDefault();

      if (e.code === "ArrowDown") {
        handleLineNavigation("down");
      } else if (e.code === "ArrowUp") {
        handleLineNavigation("up");
      } else if (e.code === "Backspace") {
        handleContinuous();
      } else if (e.code === "Enter") {
        handleSameLevel();
      } else if (e.code === "ArrowRight") {
        handleIndent();
      }

      console.table(lines);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [lines, handleLineNavigation, handleContinuous, handleSameLevel]);

  return (
    <div className="container m-auto">
      <TSVFileUpload onUpload={(lines) => setLines(calculateIndent(lines))} />

      <ul className="container py-12">
        {lines.map((line, i) => (
          <li
            key={i}
            className={clsx(
              "flex items-center hover:cursor-pointer",
              i === activeLine ? "bg-blue-200" : "hover:bg-gray-200",
              i >= 1 && lines[i - 1].label === "s" && "mt-4",
            )}
            onClick={() => setActiveLine(i)}
            style={{ paddingLeft: `${line.indent * 1.5}rem` }}
            ref={i === activeLine ? activeRef : undefined}
          >
            {line.text}
            {line.label === "c" ? (
              <CarriageReturn className="inline ml-1 text-red-400" />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

type Line = {
  text: string;
  pointer: number; // 1-indexed, -1 for root, 0 for unset
  parent: number; // 0-indexed, -1 for root
  label: "c" | "d" | "s" | "";
  indent: number;
};

/**
 * Calculate the indentation level of each line.
 *
 * @param lines - The array of objects.
 * @returns The array of objects with the indentation level.
 */
function calculateIndent(lines: Line[]): Line[] {
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

function CarriageReturn({
  size = 12,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 10 4 15 9 20" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </svg>
  );
}

function TSVFileUpload({ onUpload }: { onUpload: (lines: Line[]) => void }) {
  return (
    <input
      type="file"
      accept=".tsv"
      onChange={(e) => {
        const file = e.target.files?.[0];

        if (file) {
          const reader = new FileReader();

          reader.onload = (e) => {
            if (e.target && typeof e.target.result === "string") {
              const lines = e.target.result
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

              onUpload(lines);
            }
          };

          reader.readAsText(file);
        }
      }}
    />
  );
}
