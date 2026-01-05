import { Link } from "wouter";

interface PatternLinkProps {
  patternId: string;
  className?: string;
}

export function PatternLink({ patternId, className = "" }: PatternLinkProps) {
  return (
    <Link
      href={`/${patternId}`}
      className={`font-mono text-primary hover:underline ${className}`}
      data-testid={`link-pattern-${patternId}`}
    >
      {patternId}
    </Link>
  );
}

// Parse text and auto-link pattern IDs like A.2.6, F.17, etc.
export function AutoLinkText({ text }: { text: string }) {
  // Pattern matches: A.1, A.2.6, F.17, G.5.3, etc.
  const patternRegex = /\b([A-G])\.(\d+(?:\.\d+)*)\b/g;
  
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = patternRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add the pattern link
    const patternId = match[0];
    parts.push(
      <PatternLink key={`${patternId}-${match.index}`} patternId={patternId} />
    );
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
