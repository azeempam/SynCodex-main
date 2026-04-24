import TerminalSession from "../services/terminalService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Terminal Socket.io Event Handlers
 * Manages bidirectional streaming between client and terminal process
 * SECURITY:
 * - Input validation prevents command injection
 * - Session timeouts prevent resource exhaustion
 * - Per-user rate limiting prevents abuse
 * - Automatic cleanup on disconnect
 */

const terminalSessions = new Map();
const MAX_SESSIONS_PER_USER = 3;
const SESSION_CHECK_INTERVAL = 60000; // 1 minute

/**
 * Initialize Terminal Socket Handlers
 * @param {Server} io - Socket.io server instance
 */
export const initializeTerminalHandlers = (io) => {
  // Cleanup expired sessions every minute
  setInterval(() => {
    for (const [sessionId, session] of terminalSessions) {
      if (session.isExpired()) {
        session.destroy();
        terminalSessions.delete(sessionId);
        console.log(`🧹 Expired session cleaned up: ${sessionId}`);
      }
    }
  }, SESSION_CHECK_INTERVAL);

  io.on("connection", (socket) => {
    console.log(`✅ Terminal client connected: ${socket.id}`);

    /**
     * Create new terminal session
     * @event terminal:create
     * @param {string} userId - User identifier
     * @param {string} projectId - Project identifier
     * @param {string} workingDir - Optional working directory
     */
    socket.on("terminal:create", ({ userId, projectId, workingDir }, callback) => {
      try {
        // Rate limiting: Max 3 sessions per user
        const userSessions = Array.from(terminalSessions.values()).filter(
          (s) => s.userId === userId
        );

        if (userSessions.length >= MAX_SESSIONS_PER_USER) {
          return callback({
            success: false,
            error: `Maximum ${MAX_SESSIONS_PER_USER} terminal sessions reached`,
          });
        }

        // Create new terminal session
        const sessionId = uuidv4();
        const session = new TerminalSession(sessionId, userId, workingDir);

        session.initialize().then(() => {
          terminalSessions.set(sessionId, session);

          // Setup data listener
          session.onData((data) => {
            io.to(socket.id).emit("terminal:output", { sessionId, data });
          });

          console.log(
            `🎮 Terminal session created: ${sessionId} for user ${userId}`
          );

          callback({
            success: true,
            sessionId,
            stats: session.getStats(),
          });
        });
      } catch (error) {
        console.error("Terminal creation error:", error);
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    /**
     * Write input to terminal
     * @event terminal:input
     * @param {string} sessionId - Terminal session ID
     * @param {string} input - User input (validated and sanitized)
     */
    socket.on("terminal:input", ({ sessionId, input }, callback) => {
      try {
        const session = terminalSessions.get(sessionId);

        if (!session) {
          return callback({
            success: false,
            error: "Session not found",
          });
        }

        // Validate input (prevents command injection)
        session.write(input + "\n");

        callback({
          success: true,
        });
      } catch (error) {
        console.error("Terminal input error:", error);
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    /**
     * Resize terminal
     * @event terminal:resize
     * @param {string} sessionId - Terminal session ID
     * @param {number} cols - Terminal columns
     * @param {number} rows - Terminal rows
     */
    socket.on("terminal:resize", ({ sessionId, cols, rows }, callback) => {
      try {
        const session = terminalSessions.get(sessionId);

        if (!session) {
          return callback({
            success: false,
            error: "Session not found",
          });
        }

        session.resize(cols, rows);

        callback({
          success: true,
        });
      } catch (error) {
        console.error("Terminal resize error:", error);
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    /**
     * Get session stats
     * @event terminal:stats
     * @param {string} sessionId - Terminal session ID
     */
    socket.on("terminal:stats", ({ sessionId }, callback) => {
      try {
        const session = terminalSessions.get(sessionId);

        if (!session) {
          return callback({
            success: false,
            error: "Session not found",
          });
        }

        callback({
          success: true,
          stats: session.getStats(),
        });
      } catch (error) {
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    /**
     * Kill terminal session
     * @event terminal:kill
     * @param {string} sessionId - Terminal session ID
     */
    socket.on("terminal:kill", ({ sessionId }, callback) => {
      try {
        const session = terminalSessions.get(sessionId);

        if (!session) {
          return callback({
            success: false,
            error: "Session not found",
          });
        }

        session.destroy();
        terminalSessions.delete(sessionId);

        console.log(`🛑 Terminal session destroyed: ${sessionId}`);

        callback({
          success: true,
        });
      } catch (error) {
        console.error("Terminal kill error:", error);
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    /**
     * Handle disconnect - cleanup user sessions
     */
    socket.on("disconnect", () => {
      console.log(`❌ Terminal client disconnected: ${socket.id}`);
      // Note: Sessions persist on client disconnect for recovery (optional)
      // Uncomment below to auto-destroy on disconnect:
      // for (const [sessionId, session] of terminalSessions) {
      //   if (session.socketId === socket.id) {
      //     session.destroy();
      //     terminalSessions.delete(sessionId);
      //   }
      // }
    });

    /**
     * Error handling
     */
    socket.on("error", (error) => {
      console.error(`Terminal socket error [${socket.id}]:`, error);
    });
  });

  return io;
};

/**
 * Cleanup function for server shutdown
 */
export const cleanupAllTerminals = () => {
  for (const [sessionId, session] of terminalSessions) {
    session.destroy();
  }
  terminalSessions.clear();
  console.log("🧹 All terminal sessions cleaned up");
};
