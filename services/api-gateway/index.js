const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const createLogger = require("./shared/logger");
const logger = createLogger("api-gateway");

const app = express();
app.use(cors());
// NOTE: Do NOT use express.json() here — it consumes the request body stream
// before http-proxy-middleware can forward it, causing POST requests to hang.

const PORT = process.env.PORT || 8000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

if (!AUTH_SERVICE_URL) {
  throw new Error("AUTH_SERVICE_URL not set");
}

// Logging Middleware for Gateway
app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.url
  });
  next();
});

// Common proxy options
const proxyOptions = (pathRewrite) => ({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  ...(pathRewrite && { pathRewrite }),
  on: {
    error: (err, req, res) => {
      logger.error("Proxy error", { error: err.message, url: req.url });
      if (!res.headersSent) {
        res.status(502).json({ error: "Service unavailable" });
      }
    }
  }
});

// Proxy Rules
app.use("/auth", createProxyMiddleware(proxyOptions({ "^/auth": "" })));
app.use("/assessment", createProxyMiddleware(proxyOptions({ "^/assessment": "" })));

// Fallback for direct assessment-engine calls if needed
app.use("/questions", createProxyMiddleware(proxyOptions()));
app.use("/submit", createProxyMiddleware(proxyOptions()));
app.use("/validate-assessment", createProxyMiddleware(proxyOptions()));
app.use("/events", createProxyMiddleware(proxyOptions()));
app.use("/me", createProxyMiddleware(proxyOptions()));

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});
