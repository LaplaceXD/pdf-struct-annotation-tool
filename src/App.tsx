import { clsx } from "clsx";
import { ComponentProps, forwardRef, useEffect, useRef, useState } from "react";

import type { Line } from "./tsv/types";
import { saveLinesToTsv, parseTsvFile } from "./tsv/utils";
import {
  deleteLine,
  excludeLine,
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
  const [expanded, setExpanded] = useState(false);
  const [initialValues, setInitialValues] = useState<Line[]>([]);
  const [filename, setFilename] = useState<string>("")

  const [lines, setLines] = useState<Line[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent the scrollbar from moving when using the arrow keys.
      e.preventDefault();

      if (e.code === "ArrowDown") {
        activeLine < lines.length - 1 && setActiveLine(activeLine + 1);
        activeRef.current?.scrollIntoView(scrollBehavior);
      } else if (e.code === "ArrowUp") {
        activeLine > 0 && setActiveLine(activeLine - 1);
        activeRef.current?.scrollIntoView(scrollBehavior);
      } else if (e.code === "Space") {
        setLines(backspace(lines.slice(), activeLine));
        activeLine < lines.length - 1 && setActiveLine(activeLine + 1);
      } else if (e.code === "Enter") {
        setLines(insertNewLine(lines.slice(), activeLine));
        activeLine < lines.length - 1 && setActiveLine(activeLine + 1);
      } else if (e.code === "ArrowRight") {
        setLines(incrementIndent(lines.slice(), activeLine));
      } else if (e.code === "ArrowLeft") {
        setLines(decrementIndent(lines.slice(), activeLine));
      } else if (e.code === "Backspace") {
        setLines(excludeLine(lines.slice(), activeLine));
      } else if (e.code === "Delete") {
        setLines(deleteLine(lines.slice(), activeLine));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [lines, activeLine, setLines, setActiveLine]);

  return (
    <div>
      <header className="bg-black text-white px-12 py-6 flex justify-between">
        <input
          type="file"
          accept=".tsv"
          onChange={async (e) => {
            const file = e.target.files?.[0];

            if (file) {
              const lines = await parseTsvFile(file);
              setLines(lines);
              setInitialValues(lines.map((line) => ({ ...line }))); // Deep copy
              setFilename(file.name);
            }
          }}
        />

        <section role="menu" className="flex gap-4">
          <Button onClick={() => setExpanded(!expanded)} variant="outline">
            {expanded ? "Collapse" : "Expand"}
          </Button>
          <Button
            onClick={() => setLines(initialValues.map((line) => ({ ...line })))} // Deep copy
            variant="outline"
          >
            Reset
          </Button>
          <Button onClick={() => saveLinesToTsv(lines, filename)}>Save</Button>
        </section>
      </header>

      <section className="grid grid-cols-4 container m-auto gap-2 p-4 bg-gray-100 mt-4 rounded-xl">
        <h2 className="col-span-4 text-lg font-semibold">Keybinds</h2>
        <Action keyCode="ArrowUp" description="Move Up" />
        <Action keyCode="ArrowDown" description="Move Down" />
        <Action keyCode="Enter" description="Insert new line" />
        <Action keyCode="Space" description="Concatenate with previous line" />
        <Action
          keyCode="ArrowRight"
          description="Increment indent of current line"
        />
        <Action
          keyCode="ArrowLeft"
          description="Decrement indent of current line"
        />
        <Action keyCode="Backspace" description="Skip line" />
        <Action keyCode="Delete" description="Delete line" />
      </section>

      <ul className="container py-12 m-auto">
        {lines.map((line, i) => (
          <LineDisplay
            key={i}
            line={line}
            num={i + 1}
            onClick={() => setActiveLine(i)}
            ref={i === activeLine ? activeRef : null}
            active={i === activeLine}
            expanded={expanded}
          />
        ))}
      </ul>
    </div>
  );
}

const LineDisplay = forwardRef<
  HTMLLIElement,
  {
    line: Line;
    onClick: () => void;
    active?: boolean;
    num: number;
    expanded?: boolean;
  }
>(function ({ line, onClick, active, expanded, num }, ref) {
  return (
    <li
      ref={ref}
      onClick={onClick}
      className={clsx(
        "grid gap-4 items-center hover:cursor-pointer",
        expanded ? "grid-cols-[repeat(3,32px)_1fr]" : "grid-cols-[32px_1fr]",
        active ? "bg-blue-200" : "odd:bg-gray-200 even:bg-gray-50",
        line.label === "s" && "mb-8",
        line.label === "x" && "!bg-red-200",
      )}
    >
      {expanded ? (
        <>
          <span className="justify-self-end text-gray-600 text-sm">
            {line.label}
          </span>
          <span className="justify-self-end text-gray-600 text-sm">
            {line.pointer}
          </span>
        </>
      ) : null}
      <span className="justify-self-end text-gray-600 text-sm">{num}</span>
      <span
        className={clsx(
          "flex items-center hover:cursor-pointer",
          line.label === "x" && "line-through text-red-500",
          line.label === "e" && "line-through",
        )}
        style={{ paddingLeft: `${line.indent * 2}rem` }}
      >
        {line.text}
        {line.label === "c" ? (
          <CarriageReturn className="inline ml-1 text-red-400" />
        ) : null}
      </span>
    </li>
  );
});

function Button({
  className,
  children,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "outline" }) {
  return (
    <button
      className={clsx(
        "px-4 py-2 rounded-md text-sm font-semibold capitalize",
        variant === "outline" && "bg-white border border-black text-blue-500",
        variant === "primary" && "bg-blue-500 text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Action({
  keyCode,
  description,
}: {
  keyCode: string;
  description: string;
}) {
  return (
    <span className="flex gap-2 items-center text-sm">
      <kbd className="bg-black p-2 rounded-md text-white">{keyCode}</kbd>
      {description}
    </span>
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
