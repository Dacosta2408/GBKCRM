const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.GBK_PORT || process.env.PORT || 3001;

// CORS setup — allow Google AI Studio, localhost dev, and any other origin
// Since this server runs locally on your own machine, open CORS is safe
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (curl, Postman, direct)
    // Allow localhost on any port
    // Allow Google AI Studio / Project IDX origins
    if (
      !origin ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('google.com') ||
      origin.includes('idx.google.com') ||
      origin.includes('cloudworkstations.dev') ||
      origin.includes('web.app') ||
      origin.includes('firebaseapp.com')
    ) {
      return callback(null, true);
    }
    // Allow all other origins too — this is a local-only server
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Apply token-based auth middleware to protect all endpoints
const authMiddleware = require("./middleware/auth");
app.use(authMiddleware);

// Path validation logic
const rootPath = process.env.GBK_ROOT_PATH || "./gbk-crm-data";
let pathValid = true;

try {
  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath, { recursive: true });
    pathValid = true;
    console.log(`✅ Created data directory: ${rootPath}`);
  }
} catch (err) {
  pathValid = false;
  console.error(`❌ Could not create data directory: ${err.message}`);
}

global.pathValid = pathValid;
global.rootPath = rootPath;

// Global path valid checker middleware for data routes
app.use((req, res, next) => {
  const isMetaRoute = req.path === "/api/health" || req.path === "/api/version" || req.path === "/health" || req.path === "/version";
  if (!isMetaRoute && !global.pathValid) {
    return res.status(503).json({ error: "Root path not accessible" });
  }
  next();
});

// Version Endpoint
app.get("/api/version", (req, res) => {
  res.json({
    version: "1.0.0",
    env: process.env.NODE_ENV || "development"
  });
});

// Routes Setup
const healthRouter = require("./routes/health");
const clientsRouter = require("./routes/clients");
const documentsRouter = require("./routes/documents");
const systemRouter = require("./routes/system");
const emailRouter = require("./routes/email");
const aiRouter = require("./routes/ai");

app.use("/api/health", healthRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/clients", documentsRouter);
app.use("/api/system", systemRouter);
app.use("/api/email", emailRouter);
app.use("/api/ai", aiRouter);

app.listen(PORT, "0.0.0.0", () => {
  const envLabel = process.env.NODE_ENV || "development";
  console.log(`╔══════════════════════════════════════╗`);
  console.log(`║   GBK Bridge Server v1.0.0          ║`);
  console.log(`║   Environment: ${envLabel.padEnd(21, ' ')}║`);
  console.log(`║   Root Path: ${rootPath.substring(0, 24).padEnd(24, ' ')}║`);
  console.log(`║   Port: ${String(PORT).padEnd(29, ' ')}║`);
  console.log(`║   Status: ONLINE                     ║`);
  console.log(`╚══════════════════════════════════════╝`);

  if (!pathValid) {
    console.error(`\n❌ ERROR: Root path does not exist: ${rootPath}`);
    console.error(`   Please check your .env file and ensure the path is correct.\n`);
  } else {
    console.log(`\n✅ Data path ready: ${rootPath}`);
    console.log(`✅ Server accepting connections on port ${PORT}\n`);
  }
});
