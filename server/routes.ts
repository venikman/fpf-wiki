import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertArtifactSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed initial data if database is empty
  await storage.seedInitialData();

  // Get all artifacts
  app.get("/api/artifacts", async (req, res) => {
    try {
      const { query, part, type } = req.query;
      const artifacts = await storage.searchArtifacts(
        query as string | undefined,
        part as string | undefined,
        type as string | undefined
      );
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifacts" });
    }
  });

  // Get artifact by pattern ID (for /api/artifacts/:patternId route)
  app.get("/api/artifacts/:patternId", async (req, res) => {
    try {
      const { patternId } = req.params;
      const decodedId = decodeURIComponent(patternId);
      
      // First try to find by UUID
      let artifact = await storage.getArtifactById(decodedId);
      
      // If not found, try by pattern ID
      if (!artifact) {
        artifact = await storage.getArtifactByPatternId(decodedId);
      }
      
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      
      res.json(artifact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifact" });
    }
  });

  // Create artifact
  app.post("/api/artifacts", async (req, res) => {
    try {
      const parsed = insertArtifactSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid artifact data", details: parsed.error.errors });
      }

      // Check if pattern ID already exists
      const existing = await storage.getArtifactByPatternId(parsed.data.patternId);
      if (existing) {
        return res.status(409).json({ error: "Pattern ID already exists" });
      }

      const artifact = await storage.createArtifact(parsed.data);
      res.status(201).json(artifact);
    } catch (error) {
      res.status(500).json({ error: "Failed to create artifact" });
    }
  });

  // Update artifact
  app.patch("/api/artifacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If changing pattern ID, check it doesn't already exist
      if (updates.patternId) {
        const existing = await storage.getArtifactByPatternId(updates.patternId);
        if (existing && existing.id !== id) {
          return res.status(409).json({ error: "Pattern ID already exists" });
        }
      }

      const artifact = await storage.updateArtifact(id, updates);
      
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      
      res.json(artifact);
    } catch (error) {
      res.status(500).json({ error: "Failed to update artifact" });
    }
  });

  // Delete artifact
  app.delete("/api/artifacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteArtifact(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete artifact" });
    }
  });

  // Search artifacts
  app.get("/api/search", async (req, res) => {
    try {
      const { q, part, type } = req.query;
      const artifacts = await storage.searchArtifacts(
        q as string | undefined,
        part as string | undefined,
        type as string | undefined
      );
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  return httpServer;
}
