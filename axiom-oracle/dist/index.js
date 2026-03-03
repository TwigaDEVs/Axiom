"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", routes_1.default);
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
exports.default = app;
//# sourceMappingURL=index.js.map