import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import bodyParser from "body-parser";
import contactRoutes from "./routes/contactRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import emotionRoutes from "./routes/emotionRoutes.js";
import { initializeTerminalHandlers, cleanupAllTerminals } from "./handlers/terminalHandler.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "8mb" })); 
app.use(bodyParser.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", contactRoutes);
app.use("/api/user", userRoutes); 
app.use("/api/projects", projectRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/emotion", emotionRoutes);

// Root Endpoint (for testing)
app.get("/", (req, res) => {
  res.send("🔥 SynCodex Backend is Running! 🔥");
});

/**
 * Initialize Terminal Socket Handlers
 */
initializeTerminalHandlers(io);

/**
 * Socket.io Event Handlers for Real-time File Operations
 */
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  /**
   * Client joins a project room
   */
  socket.on("project:join", ({ projectId, userId }) => {
    socket.join(`project:${projectId}`);
    console.log(`👤 User ${userId} joined project ${projectId}`);
    io.to(`project:${projectId}`).emit("user:joined", { userId, socketId: socket.id });
  });

  /**
   * Client leaves a project room
   */
  socket.on("project:leave", ({ projectId, userId }) => {
    socket.leave(`project:${projectId}`);
    console.log(`👤 User ${userId} left project ${projectId}`);
    io.to(`project:${projectId}`).emit("user:left", { userId });
  });

  /**
   * Broadcast file creation
   */
  socket.on("file:create", ({ projectId, parentFolderId, fileData }) => {
    console.log(`📝 File created in ${projectId}: ${fileData.name}`);
    io.to(`project:${projectId}`).emit("file:created", {
      parentFolderId,
      nodeData: fileData,
    });
  });

  /**
   * Broadcast folder creation
   */
  socket.on("folder:create", ({ projectId, parentFolderId, folderData }) => {
    console.log(`📁 Folder created in ${projectId}: ${folderData.name}`);
    io.to(`project:${projectId}`).emit("folder:created", {
      parentFolderId,
      nodeData: folderData,
    });
  });

  /**
   * Broadcast node deletion
   */
  socket.on("node:delete", ({ projectId, nodeId }) => {
    console.log(`🗑️ Node deleted in ${projectId}: ${nodeId}`);
    io.to(`project:${projectId}`).emit("node:deleted", { nodeId });
  });

  /**
   * Broadcast node rename
   */
  socket.on("node:rename", ({ projectId, nodeId, newName }) => {
    console.log(`✏️ Node renamed in ${projectId}: ${nodeId} -> ${newName}`);
    io.to(`project:${projectId}`).emit("node:renamed", { nodeId, newName });
  });

  /**
   * Broadcast file content update
   */
  socket.on("file:update", ({ projectId, fileId, content }) => {
    console.log(`🔄 File updated in ${projectId}: ${fileId}`);
    io.to(`project:${projectId}`).emit("file:updated", { fileId, content });
  });

  /**
   * Handle disconnection
   */
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  /**
   * Error handling
   */
  socket.on("error", (error) => {
    console.error(`Socket error: ${error}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔌 Socket.io listening on ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  cleanupAllTerminals();
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  cleanupAllTerminals();
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});
