import { z } from "zod";

// Artifact types for FPF patterns
export const artifactTypes = ["Card", "Table", "Record", "Standard", "Spec", "Term"] as const;
export type ArtifactType = typeof artifactTypes[number];

// Parts A-G
export const parts = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type Part = typeof parts[number];

export const partNames: Record<Part, string> = {
  A: "Kernel Architecture Cluster",
  B: "Epistemic Cluster", 
  C: "Engineering Cluster",
  D: "Governance Cluster",
  E: "Method Cluster",
  F: "Assurance Cluster",
  G: "Operations Cluster",
};

// Artifact type for FPF patterns
export interface Artifact {
  id: string;
  patternId: string;
  title: string;
  part: string;
  type: string;
  status?: string;
  techLabel?: string;
  plainLabel?: string;
  tags?: string[];
  problemFrame?: string;
  problem?: string;
  forces?: string;
  solution?: string;
  conformanceChecklist?: string;
  antiPatterns?: string;
  relations?: string;
  rationale?: string;
  body?: string;
  references?: string[];
}

// Search params
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  part: z.enum(parts).optional(),
  type: z.enum(artifactTypes).optional(),
  tags: z.array(z.string()).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
