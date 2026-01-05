import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownContent } from "@/components/markdown-content";
import { Backlinks } from "@/components/backlinks";
import { partNames, type Artifact } from "@shared/schema";

export default function ArtifactPage() {
  const params = useParams<{ patternId: string }>();
  const patternId = decodeURIComponent(params.patternId || "");

  const { data: artifact, isLoading, error } = useQuery<Artifact>({
    queryKey: ["/api/artifacts", patternId],
    enabled: !!patternId,
  });

  const { data: allArtifacts = [] } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  // Find backlinks - artifacts that reference this pattern
  const backlinks = allArtifacts.filter((a) => {
    if (a.patternId === patternId) return false;
    const searchText = [
      a.references?.join(" "),
      a.relations,
      a.problem,
      a.solution,
      a.body,
    ]
      .filter(Boolean)
      .join(" ");
    return searchText.includes(patternId);
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16 bg-muted/30 rounded-lg">
          <i className="ti ti-file-off text-5xl text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Pattern Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The pattern "{patternId}" could not be found.
          </p>
          <Link href="/">
            <Button>
              <i className="ti ti-home mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    { key: "problemFrame", title: "Problem Frame", content: artifact.problemFrame },
    { key: "problem", title: "Problem", content: artifact.problem },
    { key: "forces", title: "Forces", content: artifact.forces },
    { key: "solution", title: "Solution", content: artifact.solution },
    { key: "conformanceChecklist", title: "Conformance Checklist", content: artifact.conformanceChecklist },
    { key: "antiPatterns", title: "Common Anti-patterns", content: artifact.antiPatterns },
    { key: "relations", title: "Relations", content: artifact.relations },
    { key: "rationale", title: "Rationale", content: artifact.rationale },
  ].filter((s) => s.content);

  return (
    <div className="min-h-full">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <i className="ti ti-chevron-right text-xs" />
              <Link
                href={`/search?part=${artifact.part}`}
                className="hover:text-foreground transition-colors"
              >
                Part {artifact.part}
              </Link>
              <i className="ti ti-chevron-right text-xs" />
              <span className="text-foreground font-mono">{artifact.patternId}</span>
            </nav>

            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {artifact.patternId}
                </Badge>
                {artifact.status && (
                  <Badge
                    variant={artifact.status === "Stable" ? "default" : "secondary"}
                    className={artifact.status === "Stable" ? "bg-primary" : ""}
                  >
                    {artifact.status}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold text-foreground">{artifact.title}</h1>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <i className="ti ti-folder mr-1" />
                  Part {artifact.part}: {partNames[artifact.part as keyof typeof partNames]}
                </Badge>
                {artifact.type && (
                  <Badge variant="secondary">
                    <i className="ti ti-tag mr-1" />
                    {artifact.type}
                  </Badge>
                )}
              </div>

              {/* Twin Labels */}
              {(artifact.techLabel || artifact.plainLabel) && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Twin Labels
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                </div>
              )}

              {/* Tags */}
              {artifact.tags && artifact.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artifact.tags.map((tag) => (
                    <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                      <Badge
                        variant="outline"
                        className="hover-elevate active-elevate-2 cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Content Sections */}
            <div className="space-y-8">
              {sections.map((section) => (
                <section key={section.key} id={section.key}>
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <i className="ti ti-point-filled text-primary" />
                    {section.title}
                  </h2>
                  <div className="pl-4 border-l-2 border-primary/20">
                    <MarkdownContent content={section.content!} />
                  </div>
                </section>
              ))}

              {/* General Body Content */}
              {artifact.body && (
                <section>
                  <MarkdownContent content={artifact.body} />
                </section>
              )}
            </div>

            {/* References */}
            {artifact.references && artifact.references.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <i className="ti ti-external-link text-primary" />
                    References
                  </h2>
                  <ul className="space-y-2">
                    {artifact.references.map((ref, i) => (
                      <li key={i} className="text-muted-foreground">
                        <MarkdownContent content={ref} />
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>

          {/* Sidebar - Backlinks */}
          <div className="lg:w-72 shrink-0 space-y-4">
            <div className="lg:sticky lg:top-6">
              <Backlinks backlinks={backlinks} />

              {/* Quick Navigation */}
              {sections.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <i className="ti ti-list text-muted-foreground" />
                      On this page
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {sections.map((section) => (
                        <li key={section.key}>
                          <a
                            href={`#${section.key}`}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors block py-1"
                          >
                            {section.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
