import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ArtifactCard } from "@/components/artifact-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parts, artifactTypes, partNames, type Artifact, type Part, type ArtifactType } from "@shared/schema";

export default function Search() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  
  const params = new URLSearchParams(search);
  const initialQuery = params.get("q") || "";
  const initialPart = (params.get("part") as Part) || undefined;
  const initialType = (params.get("type") as ArtifactType) || undefined;

  const [query, setQuery] = useState(initialQuery);
  const [partFilter, setPartFilter] = useState<Part | undefined>(initialPart);
  const [typeFilter, setTypeFilter] = useState<ArtifactType | undefined>(initialType);

  const { data: artifacts = [], isLoading } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (query) newParams.set("q", query);
    if (partFilter) newParams.set("part", partFilter);
    if (typeFilter) newParams.set("type", typeFilter);
    
    const paramString = newParams.toString();
    setLocation(`/search${paramString ? `?${paramString}` : ""}`, { replace: true });
  }, [query, partFilter, typeFilter, setLocation]);

  const filteredArtifacts = artifacts.filter((artifact) => {
    // Part filter
    if (partFilter && artifact.part !== partFilter) return false;
    
    // Type filter
    if (typeFilter && artifact.type !== typeFilter) return false;
    
    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      const searchableText = [
        artifact.patternId,
        artifact.title,
        artifact.techLabel,
        artifact.plainLabel,
        artifact.problem,
        artifact.solution,
        artifact.body,
        ...(artifact.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      
      if (!searchableText.includes(lowerQuery)) return false;
    }
    
    return true;
  }).sort((a, b) => a.patternId.localeCompare(b.patternId, undefined, { numeric: true }));

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  const clearFilters = () => {
    setQuery("");
    setPartFilter(undefined);
    setTypeFilter(undefined);
  };

  const hasFilters = query || partFilter || typeFilter;

  return (
    <div className="min-h-full p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <i className="ti ti-search text-primary" />
            Search Patterns
          </h1>
          <SearchBar
            defaultValue={query}
            onSearch={handleSearch}
            placeholder="Search by pattern ID, title, term, or keyword..."
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by:</span>
            <Select
              value={partFilter || "all"}
              onValueChange={(v) => setPartFilter(v === "all" ? undefined : (v as Part))}
            >
              <SelectTrigger className="w-40" data-testid="select-part-filter">
                <SelectValue placeholder="All Parts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parts</SelectItem>
                {parts.map((part) => (
                  <SelectItem key={part} value={part}>
                    Part {part} - {partNames[part].split(" ")[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter || "all"}
              onValueChange={(v) => setTypeFilter(v === "all" ? undefined : (v as ArtifactType))}
            >
              <SelectTrigger className="w-32" data-testid="select-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {artifactTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
              <i className="ti ti-x mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {query && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{query}"
                <button onClick={() => setQuery("")} className="ml-1 hover:text-foreground">
                  <i className="ti ti-x text-xs" />
                </button>
              </Badge>
            )}
            {partFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Part {partFilter}
                <button onClick={() => setPartFilter(undefined)} className="ml-1 hover:text-foreground">
                  <i className="ti ti-x text-xs" />
                </button>
              </Badge>
            )}
            {typeFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter(undefined)} className="ml-1 hover:text-foreground">
                  <i className="ti ti-x text-xs" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              "Searching..."
            ) : (
              <>
                Found <span className="font-medium text-foreground">{filteredArtifacts.length}</span> pattern
                {filteredArtifacts.length !== 1 ? "s" : ""}
              </>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : filteredArtifacts.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-lg">
              <i className="ti ti-search-off text-5xl text-muted-foreground mb-4" />
              <p className="text-lg text-foreground">No patterns found</p>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filters
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} highlight={query} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
