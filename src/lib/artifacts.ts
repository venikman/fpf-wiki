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

export const partNames: Record<string, string> = {
  A: "Kernel Architecture Cluster",
  B: "Epistemic Cluster",
  C: "Engineering Cluster",
  D: "Governance Cluster",
  E: "Method Cluster",
  F: "Assurance Cluster",
  G: "Operations Cluster",
};

export const artifacts: Artifact[] = [
  {
    id: "1",
    patternId: "A.1",
    title: "Project Kernel",
    part: "A",
    type: "Card",
    status: "Stable",
    techLabel: "Core Architecture Pattern",
    plainLabel: "The foundation of any FPF project",
    tags: ["core", "architecture", "foundation"],
    problemFrame: "How do we establish a minimal viable structure for project formalization?",
    problem: "Projects often lack a clear structural foundation, leading to inconsistent documentation and difficulty in tracking progress.",
    forces: "- Need for consistency across projects\n- Balance between structure and flexibility\n- Varying project sizes and complexities",
    solution: "Define a Project Kernel as the minimal set of artifacts and relationships required for any FPF-compliant project.",
    conformanceChecklist: "- [ ] Project has defined boundaries\n- [ ] Core artifacts are identified\n- [ ] Relationships are documented",
    relations: "References: A.2 (Artifact Registry), B.1 (Evidence Record)",
  },
  {
    id: "2",
    patternId: "A.2",
    title: "Artifact Registry",
    part: "A",
    type: "Table",
    status: "Stable",
    techLabel: "Artifact Catalog System",
    plainLabel: "A central list of all project items",
    tags: ["registry", "catalog", "artifacts"],
    problemFrame: "How do we maintain visibility of all project artifacts?",
    problem: "As projects grow, it becomes difficult to track what artifacts exist and their current state.",
    solution: "Maintain a central Artifact Registry that catalogs all project artifacts with their metadata.",
    relations: "References: A.1 (Project Kernel)",
  },
  {
    id: "3",
    patternId: "A.3",
    title: "Pattern Language",
    part: "A",
    type: "Standard",
    status: "Draft",
    techLabel: "Pattern Expression Grammar",
    plainLabel: "How we describe patterns",
    tags: ["patterns", "language", "grammar"],
    problemFrame: "How do we express patterns consistently?",
    problem: "Without a common language, patterns become difficult to communicate and apply.",
    solution: "Define a Pattern Language that provides vocabulary and grammar for expressing project knowledge.",
  },
  {
    id: "4",
    patternId: "B.1",
    title: "Evidence Record",
    part: "B",
    type: "Record",
    status: "Stable",
    techLabel: "Epistemic Documentation",
    plainLabel: "Proof and reasoning documentation",
    tags: ["evidence", "documentation", "proof"],
    problemFrame: "How do we capture and validate project knowledge?",
    problem: "Decisions are often made without clear evidence trails.",
    solution: "Create Evidence Records that document the basis for project decisions and assertions.",
    relations: "Referenced by: A.1 (Project Kernel)",
  },
  {
    id: "5",
    patternId: "B.2",
    title: "Knowledge Graph",
    part: "B",
    type: "Spec",
    status: "Draft",
    techLabel: "Semantic Knowledge Network",
    plainLabel: "Connected knowledge map",
    tags: ["knowledge", "graph", "semantic"],
    problemFrame: "How do we represent relationships between knowledge elements?",
    problem: "Knowledge often exists in silos without clear connections.",
    solution: "Build a Knowledge Graph that represents relationships between all knowledge elements in the project.",
  },
  {
    id: "6",
    patternId: "C.1",
    title: "Technical Specification",
    part: "C",
    type: "Spec",
    status: "Stable",
    techLabel: "Engineering Specification Document",
    plainLabel: "Technical details document",
    tags: ["technical", "specification", "engineering"],
    problemFrame: "How do we bridge formal patterns to technical implementation?",
    solution: "Create Technical Specifications that translate abstract patterns into concrete implementation guidance.",
  },
  {
    id: "7",
    patternId: "D.1",
    title: "Decision Record",
    part: "D",
    type: "Record",
    status: "Stable",
    techLabel: "Governance Decision Log",
    plainLabel: "Record of important decisions",
    tags: ["decisions", "governance", "log"],
    problemFrame: "How do we document and track project decisions?",
    solution: "Maintain Decision Records that capture the what, why, and who of significant project decisions.",
  },
  {
    id: "8",
    patternId: "E.1",
    title: "Process Template",
    part: "E",
    type: "Standard",
    status: "Stable",
    techLabel: "Reusable Process Pattern",
    plainLabel: "Step-by-step process guide",
    tags: ["process", "template", "method"],
    problemFrame: "How do we standardize repeatable processes?",
    solution: "Define Process Templates that provide reusable patterns for common project activities.",
  },
  {
    id: "9",
    patternId: "F.1",
    title: "Conformance Checklist",
    part: "F",
    type: "Table",
    status: "Stable",
    techLabel: "Quality Assurance Checklist",
    plainLabel: "Quality check list",
    tags: ["conformance", "checklist", "quality"],
    problemFrame: "How do we verify adherence to standards?",
    solution: "Create Conformance Checklists that systematically verify compliance with defined standards.",
  },
  {
    id: "10",
    patternId: "G.1",
    title: "Deployment Checklist",
    part: "G",
    type: "Table",
    status: "Stable",
    techLabel: "Operations Deployment Protocol",
    plainLabel: "Steps to go live",
    tags: ["deployment", "operations", "checklist"],
    problemFrame: "How do we ensure successful deployments?",
    solution: "Use Deployment Checklists that cover all necessary steps for transitioning to production.",
  },
];

export function getArtifactsByPart(part: string): Artifact[] {
  return artifacts.filter((a) => a.part === part);
}

export function getArtifactByPatternId(patternId: string): Artifact | undefined {
  return artifacts.find((a) => a.patternId === patternId);
}

export function searchArtifacts(query: string): Artifact[] {
  const lowerQuery = query.toLowerCase();
  return artifacts.filter((a) => 
    a.title.toLowerCase().includes(lowerQuery) ||
    a.patternId.toLowerCase().includes(lowerQuery) ||
    a.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
    a.techLabel?.toLowerCase().includes(lowerQuery) ||
    a.plainLabel?.toLowerCase().includes(lowerQuery)
  );
}

export function getBacklinks(patternId: string): Artifact[] {
  return artifacts.filter((a) => {
    if (a.patternId === patternId) return false;
    const searchText = [a.relations, a.problem, a.solution, a.body, a.references?.join(" ")]
      .filter(Boolean)
      .join(" ");
    return searchText.includes(patternId);
  });
}
