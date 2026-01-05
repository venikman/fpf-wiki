import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Artifact } from "@/lib/artifacts";

interface ArtifactListProps {
  artifacts: Artifact[];
  showPart?: boolean;
}

export function ArtifactList({ artifacts, showPart = false }: ArtifactListProps) {
  if (artifacts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No artifacts found.
      </div>
    );
  }

  return (
    <div className="not-content grid gap-4">
      {artifacts.map((artifact) => (
        <a 
          key={artifact.id} 
          href={`/artifacts/${artifact.patternId.toLowerCase().replace(".", "-")}/`}
          className="block no-underline"
        >
          <Card className="hover:border-accent-600 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono">
                  {artifact.patternId}
                </Badge>
                {artifact.status && (
                  <Badge variant={artifact.status === "Stable" ? "default" : "secondary"}>
                    {artifact.status}
                  </Badge>
                )}
                {artifact.type && (
                  <Badge variant="secondary">{artifact.type}</Badge>
                )}
                {showPart && (
                  <Badge variant="outline">Part {artifact.part}</Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-2">{artifact.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {artifact.plainLabel && (
                <p className="text-sm text-muted-foreground">
                  {artifact.plainLabel}
                </p>
              )}
              {artifact.tags && artifact.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {artifact.tags.slice(0, 4).map((tag) => (
                    <span 
                      key={tag} 
                      className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}
