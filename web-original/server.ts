import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEWS_FILE = path.join(process.cwd(), "views.json");

// Initialize views file if it doesn't exist
if (!fs.existsSync(VIEWS_FILE)) {
  fs.writeFileSync(VIEWS_FILE, JSON.stringify({ count: 0 }));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to increment and get views
  app.post("/api/views/increment", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(VIEWS_FILE, "utf-8"));
      data.count++;
      fs.writeFileSync(VIEWS_FILE, JSON.stringify(data));
      res.json({ success: true, count: data.count });
    } catch (error) {
      res.status(500).json({ error: "Failed to update views" });
    }
  });

  app.get("/api/views", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(VIEWS_FILE, "utf-8"));
      res.json({ count: data.count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get views" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
