import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Artifact } from "@/lib/artifacts";
import { getBacklinks, partNames } from "@/lib/artifacts";

interface ArtifactDetailProps {
  artifact: Artifact;
}

function MarkdownSection({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

export function ArtifactDetail({ artifact }: ArtifactDetailProps) {
  if (!artifact) {
    return (
      <div className="not-content text-center py-8">
        <p className="text-muted-foreground">Artifact not found.</p>
      </div>
    );
  }

  const backlinks = getBacklinks(artifact.patternId);

  return (
    <div className="not-content space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="font-mono text-base px-3 py-1">
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
        <Badge variant="outline">
          Part {artifact.part}: {partNames[artifact.part]}
        </Badge>
      </div>

      {(artifact.techLabel || artifact.plainLabel) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
              Twin Labels
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {artifact.techLabel && (
              <div>
                <span className="text-xs text-muted-foreground">Technical</span>
                <p className="font-medium">{artifact.techLabel}</p>
              </div>
            )}
            {artifact.plainLabel && (
              <div>
                <span className="text-xs text-muted-foreground">Plain Language</span>
                <p className="font-medium">{artifact.plainLabel}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {artifact.tags && artifact.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {artifact.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <MarkdownSection title="Problem Frame" content={artifact.problemFrame} />
        <MarkdownSection title="Problem" content={artifact.problem} />
        <MarkdownSection title="Forces" content={artifact.forces} />
        <MarkdownSection title="Solution" content={artifact.solution} />
        <MarkdownSection title="Conformance Checklist" content={artifact.conformanceChecklist} />
        <MarkdownSection title="Anti-patterns" content={artifact.antiPatterns} />
        <MarkdownSection title="Relations" content={artifact.relations} />
        <MarkdownSection title="Rationale" content={artifact.rationale} />
        <MarkdownSection title="Body" content={artifact.body} />
      </div>

      {backlinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Referenced By</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {backlinks.map((bl) => (
                <li key={bl.id}>
                  <a
                    href={`/artifacts/${bl.patternId.toLowerCase().replace(".", "-")}/`}
                    className="text-accent-600 hover:underline"
                  >
                    <span className="font-mono">{bl.patternId}</span> - {bl.title}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
