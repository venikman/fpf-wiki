import { AutoLinkText } from "./pattern-link";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Simple markdown-like rendering with pattern auto-linking
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let currentList: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-3">
          {currentList.map((item, i) => (
            <li key={i} className="text-foreground">
              <AutoLinkText text={item} />
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <pre
          key={`code-${elements.length}`}
          className="bg-muted rounded-md p-4 overflow-x-auto my-3 font-mono text-sm"
        >
          <code>{codeBlockContent.join("\n")}</code>
        </pre>
      );
      codeBlockContent = [];
    }
  };

  lines.forEach((line, index) => {
    // Code block handling
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-foreground">
          <AutoLinkText text={line.slice(4)} />
        </h3>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={index} className="text-xl font-semibold mt-8 mb-4 text-foreground">
          <AutoLinkText text={line.slice(3)} />
        </h2>
      );
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={index} className="text-2xl font-bold mt-8 mb-4 text-foreground">
          <AutoLinkText text={line.slice(2)} />
        </h1>
      );
      return;
    }

    // List items
    if (line.match(/^[-*]\s/)) {
      currentList.push(line.slice(2));
      return;
    }

    if (line.match(/^\d+\.\s/)) {
      currentList.push(line.replace(/^\d+\.\s/, ""));
      return;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={index} className="my-3 leading-relaxed text-foreground">
        <AutoLinkText text={line} />
      </p>
    );
  });

  flushList();
  flushCodeBlock();

  return <div className={`prose prose-sm max-w-none ${className}`}>{elements}</div>;
}
