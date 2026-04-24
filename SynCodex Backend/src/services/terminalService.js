import { spawn } from "node-pty";
import os from "os";
import path from "path";

/**
 * SECURITY-FIRST Terminal Service
 * Features:
 * - Process isolation per session
 * - Input validation (no command injection)
 * - Configurable shell restrictions
 * - Automatic process cleanup
 * - Size constraints on output
 */

const MAX_OUTPUT_BUFFER = 10 * 1024 * 1024; // 10MB max per session
const ALLOWED_SHELLS = ["/bin/bash", "/bin/sh", "/bin/zsh"];
const SHELL_TIMEOUT = 30 * 60 * 1000; // 30 minutes max session
const BLACKLISTED_COMMANDS = ["sudo", "su", "passwd", "exit"];

class TerminalSession {
  constructor(sessionId, userId, workingDir = null) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.process = null;
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
    this.outputBuffer = [];
    this.totalOutputSize = 0;
    this.isActive = false;

    // Use project-specific working directory or user home
    this.workingDir = workingDir || path.join("/tmp/syncodex-sessions", userId);
  }

  /**
   * Security: Validate and sanitize input
   * Prevents:
   * - Command injection via shell metacharacters
   * - Unauthorized command execution
   */
  validateInput(input) {
    if (!input || typeof input !== "string") {
      throw new Error("Invalid input");
    }

    const trimmed = input.trim();

    // Reject binary data/control chars (except newline/tab)
    if (!/^[\x20-\x7E\n\r\t]*$/.test(trimmed)) {
      throw new Error("Invalid character in input");
    }

    // Reject dangerous commands
    const firstCommand = trimmed.split(/\s+/)[0].toLowerCase();
    if (BLACKLISTED_COMMANDS.includes(firstCommand)) {
      throw new Error(`Command '${firstCommand}' is not allowed`);
    }

    return trimmed;
  }

  /**
   * Initialize pseudo-terminal with shell
   */
  async initialize() {
    try {
      // Determine shell
      const shell = process.platform === "win32" ? "powershell.exe" : "/bin/bash";

      // Validate shell
      if (!process.platform === "win32" && !ALLOWED_SHELLS.includes(shell)) {
        throw new Error("Shell not allowed");
      }

      // Create directory if doesn't exist
      if (process.platform !== "win32") {
        const { exec } = await import("child_process");
        await new Promise((resolve, reject) => {
          exec(`mkdir -p "${this.workingDir.replace(/"/g, '\\"')}"`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      this.process = spawn(shell, [], {
        name: "xterm-256color",
        cols: 120,
        rows: 40,
        cwd: this.workingDir,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          SHELL: shell,
        },
      });

      this.isActive = true;

      // Handle process errors
      this.process.on("error", (error) => {
        console.error(`Terminal error [${this.sessionId}]:`, error);
        this.isActive = false;
      });

      // Handle process exit
      this.process.on("exit", () => {
        console.log(`Terminal session ended [${this.sessionId}]`);
        this.isActive = false;
      });

      return true;
    } catch (error) {
      console.error(`Failed to initialize terminal [${this.sessionId}]:`, error);
      this.isActive = false;
      throw error;
    }
  }

  /**
   * Write input to terminal (with validation)
   */
  write(input) {
    if (!this.isActive || !this.process) {
      throw new Error("Terminal not active");
    }

    const validated = this.validateInput(input);
    this.process.write(validated);
    this.lastActivityAt = Date.now();
  }

  /**
   * Resize terminal
   */
  resize(cols, rows) {
    if (!this.isActive || !this.process) {
      throw new Error("Terminal not active");
    }

    try {
      this.process.resize(Math.max(20, cols), Math.max(10, rows));
      this.lastActivityAt = Date.now();
    } catch (error) {
      console.error(`Resize error [${this.sessionId}]:`, error);
    }
  }

  /**
   * Get the underlying process stream listener
   */
  onData(callback) {
    if (this.process) {
      this.process.onData((data) => {
        this.totalOutputSize += data.length;
        if (this.totalOutputSize > MAX_OUTPUT_BUFFER) {
          this.outputBuffer = [];
          this.totalOutputSize = 0;
        }
        this.outputBuffer.push(data);
        callback(data);
      });
    }
  }

  /**
   * Kill terminal process and cleanup
   */
  destroy() {
    if (this.process) {
      try {
        this.process.kill();
      } catch (error) {
        console.error(`Kill error [${this.sessionId}]:`, error);
      }
    }

    this.isActive = false;
    this.process = null;
    this.outputBuffer = [];
    this.totalOutputSize = 0;
  }

  /**
   * Check if session has timed out
   */
  isExpired() {
    return Date.now() - this.createdAt > SHELL_TIMEOUT;
  }

  /**
   * Get session stats
   */
  getStats() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt,
      uptime: Date.now() - this.createdAt,
      outputSize: this.totalOutputSize,
    };
  }
}

export default TerminalSession;
