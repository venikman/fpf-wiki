import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Artifact } from "@shared/schema";

interface BacklinksProps {
  backlinks: Artifact[];
}

export function Backlinks({ backlinks }: BacklinksProps) {
  if (backlinks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <i className="ti ti-arrow-back-up text-muted-foreground" />
          Referenced by ({backlinks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {backlinks.map((artifact) => (
            <li key={artifact.id}>
              <Link
                href={`/${artifact.patternId}`}
                className="flex items-center gap-2 text-sm hover-elevate active-elevate-2 rounded-md p-2 -mx-2"
                data-testid={`link-backlink-${artifact.patternId}`}
              >
                <Badge variant="outline" className="font-mono shrink-0">
                  {artifact.patternId}
                </Badge>
                <span className="text-muted-foreground truncate">
                  {artifact.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
