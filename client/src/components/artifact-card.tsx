import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Artifact } from "@shared/schema";

interface ArtifactCardProps {
  artifact: Artifact;
  highlight?: string;
}

export function ArtifactCard({ artifact, highlight }: ArtifactCardProps) {
  const getSnippet = () => {
    const content = artifact.problem || artifact.solution || artifact.body || "";
    if (!highlight || !content) {
      return content.slice(0, 150) + (content.length > 150 ? "..." : "");
    }
    
    const lowerContent = content.toLowerCase();
    const lowerHighlight = highlight.toLowerCase();
    const index = lowerContent.indexOf(lowerHighlight);
    
    if (index === -1) {
      return content.slice(0, 150) + (content.length > 150 ? "..." : "");
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + highlight.length + 100);
    let snippet = content.slice(start, end);
    
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";
    
    return snippet;
  };

  return (
    <Link href={`/${artifact.patternId}`} data-testid={`card-artifact-${artifact.patternId}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono">
                {artifact.patternId}
              </Badge>
              <Badge variant="secondary">Part {artifact.part}</Badge>
              {artifact.type && (
                <Badge variant="secondary">{artifact.type}</Badge>
              )}
            </div>
            {artifact.status && (
              <Badge 
                variant={artifact.status === "Stable" ? "default" : "secondary"}
                className={artifact.status === "Stable" ? "bg-primary" : ""}
              >
                {artifact.status}
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg mt-2">{artifact.title}</CardTitle>
          {(artifact.techLabel || artifact.plainLabel) && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              {artifact.techLabel && (
                <span>
                  <span className="font-medium">Tech:</span> {artifact.techLabel}
                </span>
              )}
              {artifact.plainLabel && (
                <span>
                  <span className="font-medium">Plain:</span> {artifact.plainLabel}
                </span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">
            {getSnippet()}
          </CardDescription>
          {artifact.tags && artifact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {artifact.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {artifact.tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{artifact.tags.length - 5}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
