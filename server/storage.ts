// Database storage using PostgreSQL via Drizzle ORM (javascript_database blueprint)
import { users, artifacts, type User, type InsertUser, type Artifact, type InsertArtifact } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Artifacts
  getAllArtifacts(): Promise<Artifact[]>;
  getArtifactById(id: string): Promise<Artifact | undefined>;
  getArtifactByPatternId(patternId: string): Promise<Artifact | undefined>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  updateArtifact(id: string, artifact: Partial<InsertArtifact>): Promise<Artifact | undefined>;
  deleteArtifact(id: string): Promise<boolean>;
  searchArtifacts(query?: string, part?: string, type?: string): Promise<Artifact[]>;
  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Artifact methods
  async getAllArtifacts(): Promise<Artifact[]> {
    const results = await db.select().from(artifacts);
    return results.sort((a, b) =>
      a.patternId.localeCompare(b.patternId, undefined, { numeric: true })
    );
  }

  async getArtifactById(id: string): Promise<Artifact | undefined> {
    const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id, id));
    return artifact || undefined;
  }

  async getArtifactByPatternId(patternId: string): Promise<Artifact | undefined> {
    const [artifact] = await db.select().from(artifacts).where(eq(artifacts.patternId, patternId));
    return artifact || undefined;
  }

  async createArtifact(insertArtifact: InsertArtifact): Promise<Artifact> {
    const [artifact] = await db.insert(artifacts).values(insertArtifact).returning();
    return artifact;
  }

  async updateArtifact(id: string, updates: Partial<InsertArtifact>): Promise<Artifact | undefined> {
    const [artifact] = await db
      .update(artifacts)
      .set(updates)
      .where(eq(artifacts.id, id))
      .returning();
    return artifact || undefined;
  }

  async deleteArtifact(id: string): Promise<boolean> {
    const result = await db.delete(artifacts).where(eq(artifacts.id, id)).returning();
    return result.length > 0;
  }

  async searchArtifacts(query?: string, part?: string, type?: string): Promise<Artifact[]> {
    let results = await db.select().from(artifacts);

    if (part) {
      results = results.filter((a) => a.part === part);
    }

    if (type) {
      results = results.filter((a) => a.type === type);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter((a) => {
        const searchText = [
          a.patternId,
          a.title,
          a.techLabel,
          a.plainLabel,
          a.problem,
          a.solution,
          a.body,
          ...(a.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchText.includes(lowerQuery);
      });
    }

    return results.sort((a, b) =>
      a.patternId.localeCompare(b.patternId, undefined, { numeric: true })
    );
  }

  async seedInitialData(): Promise<void> {
    // Seed admin user if not exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        username: "admin",
        password: "admin123",
        isAdmin: true,
      });
      console.log("Seeded admin user");
    }

    // Check if we already have artifact data
    const existingArtifacts = await db.select().from(artifacts).limit(1);
    if (existingArtifacts.length > 0) {
      return; // Already seeded
    }

    // Seed sample artifacts from FPF spec
    const sampleArtifacts: InsertArtifact[] = [
      {
        patternId: "A.1",
        title: "Holonic Foundation: Entity → Holon",
        part: "A",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Holon",
        plainLabel: "System Part-Whole",
        tags: ["part-whole composition", "system boundary", "entity", "holon", "U.System", "U.Episteme"],
        problemFrame: "Systems engineering and knowledge work require modeling entities that are simultaneously wholes unto themselves and parts of larger systems.",
        problem: "How do we model a system and its parts? What is a holon? What is the difference between an entity and a system?",
        forces: "- Need to represent nested hierarchies\n- Must maintain identity at each level\n- Boundaries must be clearly defined\n- Composition must be explicit",
        solution: "Define a Holon as the fundamental unit that exhibits both part and whole characteristics. Every Entity can be viewed as a Holon when we consider its internal structure and external relationships.",
        conformanceChecklist: "- [ ] Entity has defined boundary\n- [ ] Part-whole relationships are explicit\n- [ ] Identity is preserved at all levels\n- [ ] Composition rules are documented",
        relations: "**Builds on:** P-8 Cross-Scale Consistency.\n**Prerequisite for:** A.1.1, A.2, A.14, B.1.",
        rationale: "The holonic model provides a unified framework for reasoning about complex systems at multiple scales while maintaining conceptual coherence.",
      },
      {
        patternId: "A.1.1",
        title: "U.BoundedContext: The Semantic Frame",
        part: "A",
        type: "Standard",
        status: "Stable",
        techLabel: "U.BoundedContext",
        plainLabel: "Meaning Boundary",
        tags: ["local meaning", "context", "semantic boundary", "domain", "invariants", "glossary", "DDD"],
        problemFrame: "In complex systems, the same term can mean different things in different contexts. Ambiguity leads to errors and miscommunication.",
        problem: "How does FPF handle ambiguity? What is a Bounded Context in FPF? How to define rules for a specific project?",
        forces: "- Terms may be overloaded\n- Domain experts use specialized vocabularies\n- Universal definitions don't always apply\n- Local invariants may differ from global ones",
        solution: "Establish explicit Bounded Contexts that define the semantic frame within which terms have specific, unambiguous meanings. Each context maintains its own glossary and set of invariants.",
        conformanceChecklist: "- [ ] Context boundary is explicitly defined\n- [ ] Glossary of terms is maintained\n- [ ] Invariants are documented\n- [ ] Cross-context translations are specified",
        relations: "**Builds on:** A.1.\n**Prerequisite for:** A.2.1, F.0.1.",
      },
      {
        patternId: "A.2",
        title: "Role Taxonomy",
        part: "A",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Role",
        plainLabel: "Function Assignment",
        tags: ["role", "assignment", "holder", "context", "function vs identity", "responsibility", "U.RoleAssignment"],
        problemFrame: "Systems involve actors that take on different responsibilities depending on context. We need to separate what something IS from what it DOES.",
        problem: "How to model responsibilities? What is the difference between what a thing *is* and what it *does*?",
        forces: "- Identity is stable but functions change\n- Same entity can play multiple roles\n- Roles have associated capabilities and permissions\n- Context determines active roles",
        solution: "Introduce a formal Role Taxonomy that distinguishes between Holders (entities) and Roles (functions they perform). Roles are assigned within contexts and can be composed or specialized.",
        conformanceChecklist: "- [ ] Roles are distinct from holders\n- [ ] Role assignments are context-specific\n- [ ] Capabilities are role-based not entity-based\n- [ ] Role taxonomy is documented",
        relations: "**Builds on:** A.1, A.1.1.\n**Prerequisite for:** A.2.1-A.2.6, A.13, A.15.",
      },
      {
        patternId: "A.2.6",
        title: "Unified Scope Mechanism (USM): Context Slices & Scopes",
        part: "A",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Scope",
        plainLabel: "Applicability Range",
        tags: ["scope", "applicability", "ClaimScope", "WorkScope", "set-valued"],
        problemFrame: "Claims, capabilities, and work products have limited applicability. We need a consistent way to express these boundaries.",
        problem: "How to define the scope of a claim or capability? What is G in F-G-R?",
        forces: "- Scopes can be nested or overlapping\n- Different types of scopes exist (claim, work, capability)\n- Scope violations lead to invalid reasoning\n- Scopes must be composable",
        solution: "The Unified Scope Mechanism (USM) provides a consistent framework for defining and manipulating scopes across all FPF constructs. Scopes are set-valued and support standard set operations.",
        conformanceChecklist: "- [ ] Scope boundaries are explicit\n- [ ] Scope type is identified (Claim/Work/Capability)\n- [ ] Set operations are properly applied\n- [ ] Scope violations are detected",
        relations: "**Builds on:** A.1.1.\n**Constrains:** A.2.2, A.2.3, B.3.",
      },
      {
        patternId: "A.3",
        title: "Transformer Constitution (Quartet)",
        part: "A",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Transformer",
        plainLabel: "Action Model",
        tags: ["action", "causality", "change", "System-in-Role", "MethodDescription", "Method", "Work"],
        problemFrame: "Systems undergo changes and transformations. We need a coherent model for representing actions and their effects.",
        problem: "How does FPF model an action or a change? What is the transformer quartet?",
        forces: "- Actions have agents and patients\n- Methods prescribe how actions proceed\n- Work records what actually happened\n- Causality must be traceable",
        solution: "The Transformer Quartet consists of: (1) System-in-Role as agent, (2) MethodDescription as prescription, (3) Method as abstract procedure, and (4) Work as concrete execution trace.",
        conformanceChecklist: "- [ ] Agent role is specified\n- [ ] Method is referenced\n- [ ] Work is recorded\n- [ ] Causal chain is documented",
        relations: "**Builds on:** A.2.\n**Prerequisite for:** A.3.1, A.3.2, A.15.",
      },
      {
        patternId: "B.1",
        title: "Episteme Architecture",
        part: "B",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Episteme",
        plainLabel: "Knowledge Unit",
        tags: ["episteme", "knowledge", "belief", "justification", "evidence"],
        problemFrame: "Knowledge work requires distinguishing between beliefs, claims, and justified knowledge. We need a structured representation.",
        problem: "How do we represent knowledge in FPF? What is an episteme?",
        forces: "- Knowledge requires justification\n- Beliefs may be unjustified\n- Evidence supports claims\n- Knowledge evolves over time",
        solution: "An Episteme is a structured knowledge unit that explicitly captures the claim, its justification, supporting evidence, and the context in which it holds.",
        conformanceChecklist: "- [ ] Claim is explicitly stated\n- [ ] Justification is provided\n- [ ] Evidence is linked\n- [ ] Context is specified",
        relations: "**Builds on:** A.1.\n**Prerequisite for:** B.2, B.3, B.4.",
      },
      {
        patternId: "C.1",
        title: "Engineering View Architecture",
        part: "C",
        type: "Standard",
        status: "Stable",
        techLabel: "U.View",
        plainLabel: "Perspective",
        tags: ["view", "viewpoint", "stakeholder", "concern", "architecture"],
        problemFrame: "Complex systems have multiple stakeholders with different concerns. Each needs appropriate views of the system.",
        problem: "How do we provide different perspectives on a system? What is a view in FPF?",
        forces: "- Stakeholders have different concerns\n- Views must be consistent\n- Information hiding is necessary\n- Traceability to source is required",
        solution: "Views are projections of the underlying system model tailored to specific stakeholder concerns. Views are derived from viewpoints which define the conventions for creating and using views.",
        conformanceChecklist: "- [ ] Stakeholder is identified\n- [ ] Concerns are documented\n- [ ] Viewpoint conventions are followed\n- [ ] Consistency with model is maintained",
        relations: "**Builds on:** A.1.\n**Prerequisite for:** C.2, C.3.",
      },
      {
        patternId: "D.1",
        title: "Governance Framework",
        part: "D",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Governance",
        plainLabel: "Decision Authority",
        tags: ["governance", "authority", "decision", "policy", "control"],
        problemFrame: "Organizations need clear decision-making structures and accountability. Governance defines who decides what.",
        problem: "How do we model decision authority in FPF?",
        forces: "- Authority must be explicit\n- Delegation must be traceable\n- Accountability requires records\n- Policies guide decisions",
        solution: "The Governance Framework defines the structure of decision authority, including roles with decision rights, policies that constrain decisions, and records of decisions made.",
        conformanceChecklist: "- [ ] Decision rights are assigned\n- [ ] Policies are documented\n- [ ] Decisions are recorded\n- [ ] Accountability is traceable",
        relations: "**Builds on:** A.2.\n**Prerequisite for:** D.2, D.3.",
      },
      {
        patternId: "E.1",
        title: "Method Architecture",
        part: "E",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Method",
        plainLabel: "How-To Guide",
        tags: ["method", "procedure", "practice", "technique", "methodology"],
        problemFrame: "Work requires prescribed ways of doing things. Methods capture reusable procedures.",
        problem: "How do we represent methods and procedures in FPF?",
        forces: "- Methods must be teachable\n- Adaptation is often needed\n- Compliance must be verifiable\n- Methods evolve over time",
        solution: "A Method is a prescribed sequence of activities designed to achieve a particular outcome. Methods reference required capabilities, inputs, outputs, and quality criteria.",
        conformanceChecklist: "- [ ] Activities are sequenced\n- [ ] Inputs/outputs are specified\n- [ ] Quality criteria are defined\n- [ ] Prerequisites are documented",
        relations: "**Builds on:** A.3.\n**Prerequisite for:** E.2, E.3.",
      },
      {
        patternId: "F.1",
        title: "Assurance Architecture",
        part: "F",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Assurance",
        plainLabel: "Confidence Building",
        tags: ["assurance", "evidence", "argument", "claim", "confidence"],
        problemFrame: "Stakeholders need confidence that systems meet their requirements. Assurance provides structured argumentation.",
        problem: "How do we build and communicate confidence in FPF?",
        forces: "- Claims require evidence\n- Arguments must be structured\n- Confidence has degrees\n- Assurance must be auditable",
        solution: "The Assurance Architecture provides a framework for constructing structured arguments that link claims to evidence, building justified confidence in system properties.",
        conformanceChecklist: "- [ ] Claims are explicitly stated\n- [ ] Evidence is linked to claims\n- [ ] Argument structure is clear\n- [ ] Confidence level is assessed",
        relations: "**Builds on:** B.1, A.2.4.\n**Prerequisite for:** F.2, F.3.",
      },
      {
        patternId: "G.1",
        title: "Operations Framework",
        part: "G",
        type: "Standard",
        status: "Stable",
        techLabel: "U.Operations",
        plainLabel: "Runtime Management",
        tags: ["operations", "runtime", "monitoring", "maintenance", "evolution"],
        problemFrame: "Systems must be operated, monitored, and evolved over time. Operations provides the framework for ongoing management.",
        problem: "How do we manage systems in operation?",
        forces: "- Systems degrade over time\n- Environment changes\n- Failures must be handled\n- Improvements must be integrated",
        solution: "The Operations Framework defines how systems are deployed, monitored, maintained, and evolved. It includes operational procedures, monitoring regimes, and change management processes.",
        conformanceChecklist: "- [ ] Deployment procedures exist\n- [ ] Monitoring is in place\n- [ ] Maintenance procedures defined\n- [ ] Change management documented",
        relations: "**Builds on:** A.3.\n**Prerequisite for:** G.2, G.3.",
      },
      {
        patternId: "E.8",
        title: "Pattern Template",
        part: "E",
        type: "Spec",
        status: "Stable",
        techLabel: "FPF.Pattern",
        plainLabel: "Pattern Format",
        tags: ["pattern", "template", "format", "structure", "documentation"],
        problemFrame: "FPF patterns need a consistent structure for authoring and consumption. A standard template ensures uniformity.",
        problem: "What is the standard format for an FPF pattern?",
        forces: "- Patterns vary in complexity\n- Consistency aids navigation\n- Some sections are optional\n- Cross-references are common",
        solution: "The Pattern Template defines standard sections: Problem Frame, Problem, Forces, Solution, Conformance Checklist, Common Anti-patterns, Relations, and optional Rationale.",
        conformanceChecklist: "- [ ] All required sections present\n- [ ] Pattern ID follows convention\n- [ ] Cross-references use proper IDs\n- [ ] Status is indicated",
        antiPatterns: "- Omitting Problem Frame (context is crucial)\n- Vague Forces (be specific)\n- Solution without Conformance (unverifiable)\n- Missing Relations (patterns don't exist in isolation)",
        relations: "**Defines format for:** All patterns in Parts A-G.",
      },
      {
        patternId: "F.17",
        title: "Evidence Collection Protocol",
        part: "F",
        type: "Standard",
        status: "Stable",
        techLabel: "U.EvidenceProtocol",
        plainLabel: "Proof Gathering",
        tags: ["evidence", "collection", "protocol", "verification", "audit"],
        problemFrame: "Assurance claims require supporting evidence. We need systematic ways to collect and manage evidence.",
        problem: "How do we systematically collect evidence for assurance?",
        forces: "- Evidence must be relevant\n- Collection must be systematic\n- Provenance must be tracked\n- Evidence decays over time",
        solution: "The Evidence Collection Protocol specifies what evidence to collect, how to collect it, how to store and manage it, and how to link it to claims.",
        conformanceChecklist: "- [ ] Evidence types identified\n- [ ] Collection procedures defined\n- [ ] Storage requirements met\n- [ ] Provenance recorded",
        relations: "**Builds on:** F.1.\n**Used by:** F.2, F.3, B.3.",
      },
      {
        patternId: "T.1",
        title: "Holon",
        part: "A",
        type: "Term",
        status: "Stable",
        techLabel: "holon",
        plainLabel: "part-whole unit",
        tags: ["term", "definition", "holon", "system"],
        problem: "A unit that is simultaneously a whole unto itself and a part of a larger whole.",
        solution: "From Greek 'holos' (whole) + '-on' (part). Introduced by Arthur Koestler. In FPF, all entities are modeled as holons to enable consistent multi-scale reasoning.",
        relations: "**Defined in:** A.1.",
      },
      {
        patternId: "T.2",
        title: "Episteme",
        part: "B",
        type: "Term",
        status: "Stable",
        techLabel: "episteme",
        plainLabel: "knowledge unit",
        tags: ["term", "definition", "episteme", "knowledge"],
        problem: "A structured unit of justified knowledge, as opposed to mere belief or opinion.",
        solution: "From Greek 'episteme' (knowledge, understanding). In FPF, an episteme explicitly captures claim, justification, evidence, and context to distinguish knowledge from belief.",
        relations: "**Defined in:** B.1.",
      },
    ];

    for (const artifact of sampleArtifacts) {
      await db.insert(artifacts).values(artifact);
    }

    console.log(`Seeded ${sampleArtifacts.length} FPF artifacts`);
  }
}

export const storage = new DatabaseStorage();
