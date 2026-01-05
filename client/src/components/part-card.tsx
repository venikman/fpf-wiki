import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Part } from "@shared/schema";
import { partNames } from "@shared/schema";

interface PartCardProps {
  part: Part;
  count: number;
}

const partIcons: Record<Part, string> = {
  A: "ti-atom",
  B: "ti-brain",
  C: "ti-tool",
  D: "ti-shield-check",
  E: "ti-route",
  F: "ti-certificate",
  G: "ti-settings-automation",
};

export function PartCard({ part, count }: PartCardProps) {
  return (
    <Link href={`/search?part=${part}`} data-testid={`card-part-${part}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all h-full">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <i className={`ti ${partIcons[part]} text-primary text-xl`} />
            </div>
            <Badge variant="secondary">{count}</Badge>
          </div>
          <div>
            <CardTitle className="text-lg">Part {part}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {partNames[part]}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
