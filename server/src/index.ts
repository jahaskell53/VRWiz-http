import dotenv from "dotenv";
import log4js from "log4js";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import express from "express";

// Load environment variables from .env file
dotenv.config();

// Load logger configuration
log4js.configure({
  appenders: {
    out: { type: "stdout" },
    app: { type: "file", filename: "logs/app.log" },
  },
  categories: {
    default: { appenders: ["out", "app"], level: "debug" },
  },
});
const logger = log4js.getLogger("server");

// Create an express server
const exp = express();

// Create an HTTPS service
const httpsOptions = {
  // key: fs.readFileSync(process.env.KEY_PATH!),
  // cert: fs.readFileSync(process.env.CERT_PATH!),
};
const app = http.createServer(httpsOptions, exp);
logger.info("HTTPS server created");

// Create a socket.io service
const ioOptions = {
  cors: {
    origin: "*",
  },
};
const io = new Server(app, ioOptions);
logger.info("Socket.io server created");

// Set up the socket.io listeners
io.on("connection", (socket) => {
  logger.debug(`Client connected: ${socket.id}`);

  // When a user registers, broadcast the join event to all other users
  socket.on("register", (username) => {
    logger.debug(`User ${socket.id} registered as ${username}`);
    socket.broadcast.emit("join", socket.id, username);
  });

  // When a user disconnects, broadcast the leave event to all other users
  socket.on("disconnect", () => {
    logger.debug(`Client disconnected: ${socket.id}`);
    socket.broadcast.emit("leave", socket.id);
  });

  // When a user sends an update, broadcast the update event to all other users
  socket.on("update", (update) => {
    logger.trace(`Client updated: ${socket.id}`);
    socket.broadcast.emit("update", update);
  });
});

// Setup a hello world route on the express server
exp.get("/", (_req, res) => {
  res.send("Hello world!");
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
