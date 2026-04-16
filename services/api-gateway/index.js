const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();
const createLogger = require("./shared/logger");
const logger = createLogger("api-gateway");

const app = express();
app.use(cors());

const PORT = 8000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5000";

// Logging Middleware for Gateway
app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.url
  });
  next();
});

// Proxy Rules
app.use("/auth", createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/auth": "" // remove /auth prefix when forwarding to auth-service
  }
}));

app.use("/assessment", createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/assessment": "" // remove /assessment prefix
  }
}));

// Fallback for direct assessment-engine calls if needed
app.use("/questions", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/submit", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/validate-assessment", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/events", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));
app.use("/me", createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true }));

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});
