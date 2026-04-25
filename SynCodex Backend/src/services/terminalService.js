import { spawn } from "node-pty";

/**
 * Terminal Session Service
 * - Spawns a pseudo terminal via node-pty
 * - Streams output back to socket handler
 * - Writes raw keystrokes to shell process
 */

const MAX_OUTPUT_BUFFER = 10 * 1024 * 1024; // 10MB max per session
const SHELL_TIMEOUT = 30 * 60 * 1000; // 30 minutes max session

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

    this.workingDir = workingDir;
  }

  /**
   * Validate terminal input payload
   */
  validateInput(input) {
    if (!input || typeof input !== "string") {
      throw new Error("Invalid terminal input");
    }

    if (input.length > 8192) {
      throw new Error("Input too large");
    }

    return input;
  }

  /**
   * Initialize pseudo-terminal with shell
   */
  async initialize() {
    try {
      if (!this.workingDir) {
        throw new Error("Working directory is required");
      }

      const isWindows = process.platform === "win32";
      const shell = isWindows ? "powershell.exe" : "bash";
      const shellArgs = isWindows ? ["-NoLogo"] : [];

      this.process = spawn(shell, shellArgs, {
        name: "xterm-256color",
        cols: 120,
        rows: 40,
        cwd: this.workingDir,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          SHELL: isWindows ? "powershell.exe" : "bash",
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
   * Write keystroke/input to terminal
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
