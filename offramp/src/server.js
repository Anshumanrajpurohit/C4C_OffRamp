import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import preferencesRoutes from "./routes/preferences.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config({ path: new URL("../../.env.local", import.meta.url) });

const app = express();
const PORT = process.env.EXPRESS_PORT || 4000;
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
].filter(Boolean);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-cron-secret"],
  }),
);
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
// POST /api/preferences/save
// GET  /api/preferences/get/:user_id
app.use("/api/preferences", preferencesRoutes);

// GET /api/dashboard/progress/:user_id
app.use("/api/dashboard", dashboardRoutes);

// GET /api/weekly-plans/:user_id  (also in dashboardRoutes, mounted at /api)
app.use("/api", dashboardRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`OffRamp Express server running on http://localhost:${PORT}`);
});

export default app;
