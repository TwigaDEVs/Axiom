import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

// Root redirect
app.get("/", (_req, res) => {
  res.json({
    name: "Oracle Engine",
    description: "AI-powered prediction market resolution service",
    endpoints: {
      health: "GET /api/health",
      resolve: "POST /api/resolve",
      batch: "POST /api/resolve/batch",
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  Oracle Engine v0.1.0`);
  console.log(`  Listening on port ${PORT}`);
  console.log(`${"═".repeat(50)}`);
  console.log(`  Endpoints:`);
  console.log(`    GET  /api/health`);
  console.log(`    POST /api/resolve`);
  console.log(`    POST /api/resolve/batch`);
  console.log(`${"═".repeat(50)}\n`);
});

export default app;
