import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";

import type { Line } from "./tsv/types";
import { parseTsvFile } from "./tsv/utils";
import {
  insertNewLine,
  backspace,
  incrementIndent,
  decrementIndent,
} from "./tsv/actions";

const scrollBehavior: ScrollIntoViewOptions = {
  behavior: "auto",
  block: "center",
  inline: "nearest",
};

export default function App() {
  const [lines, setLines] = useState<Line[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const activeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent the scrollbar from moving when using the arrow keys.
      e.preventDefault();

      if (e.code === "ArrowDown") {
        setActiveLine(
          activeLine < lines.length - 1 ? activeLine + 1 : activeLine,
        );
        activeRef.current?.scrollIntoView(scrollBehavior);
      } else if (e.code === "ArrowUp") {
        setActiveLine(activeLine > 0 ? activeLine - 1 : activeLine);
        activeRef.current?.scrollIntoView(scrollBehavior);
      } else if (e.code === "Backspace") {
        setLines(backspace(lines, activeLine));
      } else if (e.code === "Enter") {
        setLines(insertNewLine(lines, activeLine));
        setActiveLine((activeLine) => activeLine + 1);
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
  }, [lines, activeLine, setLines, setActiveLine]);

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
            setLines(lines);
          }
        }}
      />

      <ul className="container py-12">
        {lines.map((line, i) => (
          <li
            key={i}
            onClick={() => setActiveLine(i)}
            className={clsx(
              "grid grid-cols-[48px_1fr] gap-4 items-center even:bg-gray-50 odd:bg-gray-200",
              i === activeLine && "!bg-blue-200",
              line.label === "s" && "mb-8",
              line.label === "x" && "!bg-red-200",
            )}
          >
            <span className="justify-self-end text-gray-600 text-sm">
              {i + 1}
            </span>
            <span
              className={clsx(
                "flex items-center hover:cursor-pointer",
                line.label === "x" && "line-through text-red-500",
                line.label === "e" && "line-through",
              )}
              style={{ paddingLeft: `${line.indent * 2}rem` }}
              ref={i === activeLine ? activeRef : undefined}
            >
              {line.text}
              {line.label === "c" ? (
                <CarriageReturn className="inline ml-1 text-red-400" />
              ) : null}
            </span>
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
