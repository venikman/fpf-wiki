import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all artifacts (with optional filters)
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

  // Get artifact by pattern ID
  app.get("/api/artifacts/:patternId", async (req, res) => {
    try {
      const { patternId } = req.params;
      const decodedId = decodeURIComponent(patternId);
      
      // First try to find by ID
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
