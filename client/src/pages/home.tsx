import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { PartCard } from "@/components/part-card";
import { ArtifactCard } from "@/components/artifact-card";
import { Skeleton } from "@/components/ui/skeleton";
import { parts, type Artifact, type Part } from "@shared/schema";

export default function Home() {
  const { data: artifacts = [], isLoading } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  const getCountByPart = (part: Part) => {
    return artifacts.filter((a) => a.part === part).length;
  };

  const recentArtifacts = [...artifacts]
    .sort((a, b) => {
      if (a.status === "Stable" && b.status !== "Stable") return -1;
      if (b.status === "Stable" && a.status !== "Stable") return 1;
      return 0;
    })
    .slice(0, 6);

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
            <i className="ti ti-book-2 text-primary text-3xl" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            First Principles Framework
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Searchable knowledge base for the Formal Pencil-and-Paper Framework (FPF) spec. 
            Fast lookup by PatternID, cross-links, and consistent authoring.
          </p>
          <div className="max-w-2xl mx-auto pt-4">
            <SearchBar autoFocus placeholder="Search by pattern ID (e.g., A.2.6), term, or keyword..." />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Parts Navigation */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <i className="ti ti-folder text-primary text-xl" />
            <h2 className="text-xl font-semibold text-foreground">Browse by Part</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {parts.map((part) => (
                <Skeleton key={part} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {parts.map((part) => (
                <PartCard key={part} part={part} count={getCountByPart(part)} />
              ))}
            </div>
          )}
        </section>

        {/* Recent/Featured Artifacts */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <i className="ti ti-clock text-primary text-xl" />
            <h2 className="text-xl font-semibold text-foreground">Featured Patterns</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : recentArtifacts.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <i className="ti ti-files-off text-4xl text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No artifacts yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add patterns through the Admin panel to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{artifacts.length}</div>
            <div className="text-sm text-muted-foreground">Total Patterns</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">
              {artifacts.filter((a) => a.status === "Stable").length}
            </div>
            <div className="text-sm text-muted-foreground">Stable</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">
              {artifacts.filter((a) => a.type === "Term").length}
            </div>
            <div className="text-sm text-muted-foreground">Terms</div>
          </div>
          <div className="bg-card border border-card-border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{parts.length}</div>
            <div className="text-sm text-muted-foreground">Parts (A-G)</div>
          </div>
        </section>
      </div>
    </div>
  );
}
