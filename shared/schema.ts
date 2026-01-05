import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

// Artifact schema for FPF patterns
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patternId: text("pattern_id").notNull().unique(),
  title: text("title").notNull(),
  part: text("part").notNull(),
  type: text("type").notNull(),
  status: text("status").default("Draft"),
  techLabel: text("tech_label"),
  plainLabel: text("plain_label"),
  tags: text("tags").array(),
  problemFrame: text("problem_frame"),
  problem: text("problem"),
  forces: text("forces"),
  solution: text("solution"),
  conformanceChecklist: text("conformance_checklist"),
  antiPatterns: text("anti_patterns"),
  relations: text("relations"),
  rationale: text("rationale"),
  body: text("body"),
  references: text("references").array(),
});

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
});

export type InsertArtifact = z.infer<typeof insertArtifactSchema>;
export type Artifact = typeof artifacts.$inferSelect;

// Search params
export const searchParamsSchema = z.object({
  query: z.string().optional(),
  part: z.enum(parts).optional(),
  type: z.enum(artifactTypes).optional(),
  tags: z.array(z.string()).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
