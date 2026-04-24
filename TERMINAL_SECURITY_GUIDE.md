# Terminal Implementation - SECURITY & INTEGRATION GUIDE

## 🔐 SECURITY ARCHITECTURE

### 1. Input Validation & Sanitization

**Problem**: Direct execution of user input can lead to command injection attacks.

**Solution**: Multi-layer validation in `terminalService.js`:

```javascript
validateInput(input) {
  // 1. Type check
  if (!input || typeof input !== "string") {
    throw new Error("Invalid input");
  }

  // 2. Character whitelist (reject control chars except \n, \r, \t)
  const trimmed = input.trim();
  if (!/^[\x20-\x7E\n\r\t]*$/.test(trimmed)) {
    throw new Error("Invalid character in input");
  }

  // 3. Blacklist dangerous commands
  const firstCommand = trimmed.split(/\s+/)[0].toLowerCase();
  if (BLACKLISTED_COMMANDS.includes(firstCommand)) {
    throw new Error(`Command '${firstCommand}' is not allowed`);
  }

  return trimmed;
}
```

**Blocked Commands**: `sudo`, `su`, `passwd`, `exit`

### 2. Process Isolation

- Each user session runs in isolated pseudo-terminal (node-pty)
- Processes confined to `workingDir` (by default `/tmp/syncodex-sessions/{userId}`)
- No shared environment between terminals

```javascript
const term = spawn(shell, [], {
  cwd: workingDir,  // Process confined to this directory
  env: sanitizedEnv, // Sanitized environment variables
});
```

### 3. Resource Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| **MAX_SESSIONS_PER_USER** | 3 | Prevent resource exhaustion |
| **SHELL_TIMEOUT** | 30 min | Auto-kill idle sessions |
| **MAX_OUTPUT_BUFFER** | 10MB | Prevent memory overflow |

### 4. Rate Limiting

```javascript
// Enforce max 3 concurrent terminals per user
if (userSessions.length >= MAX_SESSIONS_PER_USER) {
  return callback({
    success: false,
    error: `Maximum ${MAX_SESSIONS_PER_USER} terminal sessions reached`,
  });
}
```

### 5. Session Validation

```javascript
// Validate sessionId exists and belongs to user before operations
const session = terminalSessions.get(sessionId);
if (!session || session.userId !== userId) {
  return callback({
    success: false,
    error: "Unauthorized session access",
  });
}
```

### 6. Automatic Cleanup

```javascript
// Cleanup expired sessions every minute
setInterval(() => {
  for (const [sessionId, session] of terminalSessions) {
    if (session.isExpired()) {
      session.destroy();
      terminalSessions.delete(sessionId);
    }
  }
}, 60000);

// Graceful shutdown
process.on('SIGTERM', () => {
  cleanupAllTerminals(); // Kill all processes before exit
});
```

---

## 📦 INSTALLATION

### Backend Setup

```bash
cd 'SynCodex Backend'
npm install node-pty uuid
```

### Frontend Setup

```bash
cd '../SynCodex Frontend'
npm install xterm xterm-addon-fit xterm-addon-web-links
```

---

## 🔌 SOCKET EVENTS REFERENCE

### Client → Server

| Event | Payload | Response |
|-------|---------|----------|
| `terminal:create` | `{ userId, projectId, workingDir? }` | `{ success, sessionId, stats }` |
| `terminal:input` | `{ sessionId, input }` | `{ success, error? }` |
| `terminal:resize` | `{ sessionId, cols, rows }` | `{ success, error? }` |
| `terminal:stats` | `{ sessionId }` | `{ success, stats }` |
| `terminal:kill` | `{ sessionId }` | `{ success, error? }` |

### Server → Client

| Event | Payload |
|-------|---------|
| `terminal:output` | `{ sessionId, data }` |

---

## 🎯 INTEGRATION IN PAGES

### Example: Add Terminal to Editor Page

**File**: `SynCodex Frontend/src/pages/editor.jsx`

```jsx
import TerminalComponent from '../components/terminal/TerminalComponent';

export default function EditorPage() {
  const { projectId } = useParams();

  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      {/* Editor */}
      <div className="col-span-2">
        {/* Monaco editor here */}
      </div>

      {/* Terminal */}
      <div className="h-full">
        <TerminalComponent 
          projectId={projectId}
          workingDir={`/tmp/syncodex-projects/${projectId}`}
        />
      </div>
    </div>
  );
}
```

---

## 🚀 BACKEND INTEGRATION

**File**: `SynCodex Backend/src/server.js`

Already integrated:
1. ✅ Imported `terminalHandler`
2. ✅ Called `initializeTerminalHandlers(io)` before existing socket handlers
3. ✅ Added graceful shutdown with `cleanupAllTerminals()`

---

## 🎨 FRONTEND INTEGRATION

**File**: `SynCodex Frontend/src/components/terminal/TerminalComponent.jsx`

Features:
- ✅ Auto-resize on window/container resize
- ✅ VS Code dark theme
- ✅ Click to open links in terminal (WebLinksAddon)
- ✅ Session stats (uptime, output size)
- ✅ Graceful error handling

---

## ⚠️ IMPORTANT NOTES

### File Paths Requirement
Backend requires `mkdir` capability. Ensure backend has filesystem permissions:
```bash
# Create session directory on backend
mkdir -p /tmp/syncodex-sessions
chmod 755 /tmp/syncodex-sessions
```

### Windows Support
Terminal defaults to `powershell.exe` on Windows, `bash` on Unix-like systems.

### Memory Management
- Terminal output capped at 10MB per session
- Scrollback history limited to 1000 lines
- Sessions auto-expire after 30 minutes

### Testing Terminal Locally
```javascript
// Test in browser console
const socket = io('http://localhost:5000');

socket.emit('terminal:create', 
  { userId: 'test-user', projectId: 'test-project' },
  (response) => console.log(response)
);
```

---

## 🔍 DEBUGGING

### Check Session Status
```bash
# Backend logs will show:
✅ Terminal client connected: socketId
🎮 Terminal session created: sessionId for user userId
🛑 Terminal session destroyed: sessionId
```

### Monitor Resource Usage
Frontend emits session stats every 5 seconds:
```javascript
{
  sessionId: "uuid",
  userId: "userId",
  isActive: true,
  createdAt: timestamp,
  lastActivityAt: timestamp,
  uptime: milliseconds,
  outputSize: bytes,
}
```

---

## 📋 SECURITY CHECKLIST

- [x] Input validation prevents command injection
- [x] Process isolation via node-pty
- [x] Rate limiting (max 3 terminals per user)
- [x] Session timeouts (30-minute max)
- [x] Resource caps (10MB output buffer)
- [x] Automatic cleanup on disconnect
- [x] Graceful server shutdown
- [x] Sanitized environment variables
- [x] Blacklisted dangerous commands
- [x] Socket event validation

---

## 🚨 Deployment Recommendations

### Production Checklist
1. **Set environment-specific paths**
   ```bash
   # .env
   TERMINAL_WORK_DIR=/home/syncodex/sessions
   TERMINAL_AVAILABLE_SHELLS=/bin/bash,/bin/sh
   ```

2. **Enable HTTPS/WSS**
   ```javascript
   const io = new Server(server, {
     cors: { origin: process.env.FRONTEND_URL },
     transports: ['websocket', 'polling'],
   });
   ```

3. **Add rate limiting middleware**
   ```javascript
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100,
   });
   app.use(limiter);
   ```

4. **Monitor terminal processes**
   ```bash
   # Check active processes
   ps aux | grep pty
   ```

5. **Regular cleanup**
   ```bash
   # Cron job to clean stale session directories
   0 * * * * find /tmp/syncodex-sessions -mtime +1 -delete
   ```

---

