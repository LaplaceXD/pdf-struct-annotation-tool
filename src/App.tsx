import { clsx } from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Line } from "./tsv/types";
import { parseTsvFile } from "./tsv/io";
import {
  incrementIndent,
  decrementIndent,
  calculateIndent,
} from "./tsv/indents";

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

    const grandParent = newLines[activeLine].parent;

    if (newLines[activeLine].label === "d") {
      for (let i = activeLine + 1; i < newLines.length; i++) {
        if (newLines[i].pointer === activeLine + 1) {
          newLines[i].pointer = grandParent === -1 ? -1 : grandParent + 1;
        }

        if (newLines[i].parent === activeLine && newLines[i].indent === 1) {
          newLines[i].pointer = 0;
        }
      }
    }

    newLines[activeLine].label = "s";

    setLines(calculateIndent(newLines));
    setActiveLine((activeLine) => activeLine + 1);
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
        setLines(incrementIndent(lines, activeLine));
      } else if (e.code === "ArrowLeft") {
        setLines(decrementIndent(lines, activeLine));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleLineNavigation, handleContinuous, handleSameLevel]);

  useEffect(() => {
    // This is just for logging
    console.table(lines);
  }, [lines]);

  return (
    <div className="container m-auto">
      <input
        type="file"
        accept=".tsv"
        onChange={async (e) => {
          const file = e.target.files?.[0];

          if (file) {
            const lines = await parseTsvFile(file);
            setLines(calculateIndent(lines));
          }
        }}
      />

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
