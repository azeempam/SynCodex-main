import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { SocketProvider } from '../../context/SocketProvider';

const TerminalComponent = ({ projectId, workingDir = null }) => {
  const terminalRef = useRef(null);
  const xTermRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(new FitAddon());
  const resizeObserverRef = useRef(null);
  
  const [sessionId, setSessionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useContext(UserContext);
  const { socket } = useContext(SocketProvider);

  /**
   * Initialize xterm and establish socket connection
   */
  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#e0e0e0',
        cursor: '#00d4ff',
        cursorAccent: '#1e1e1e',
        selection: 'rgba(0, 212, 255, 0.3)',
        black: '#000000',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#17b2b7',
        white: '#d4d4d4',
      },
      scrollback: 1000,
      screenKeys: true,
      mouse: true,
    });

    // Add addons
    term.loadAddon(fitAddonRef.current);
    term.loadAddon(new WebLinksAddon());

    // Open terminal
    term.open(terminalRef.current);
    xTermRef.current = term;

    // Fit terminal to container
    setTimeout(() => {
      try {
        fitAddonRef.current.fit();
      } catch (error) {
        console.warn('Initial fit failed:', error);
      }
    }, 100);

    // Setup socket listeners
    if (socket) {
      socketRef.current = socket;

      // Listen for terminal output
      socket.on('terminal:output', ({ sessionId: recvSessionId, data }) => {
        if (recvSessionId === sessionId) {
          term.write(data);
        }
      });

      // Create terminal session
      socket.emit(
        'terminal:create',
        {
          userId: user?._id,
          projectId,
          workingDir,
        },
        (response) => {
          setIsLoading(false);
          if (response.success) {
            setSessionId(response.sessionId);
            setSessionStats(response.stats);
            term.focus();
            term.write('\r\n💻 Terminal ready!\r\n');
          } else {
            term.write(`\r\n❌ Error: ${response.error}\r\n`);
          }
        }
      );

      setIsLoading(true);
      setIsConnected(true);
    }

    // Handle terminal input
    const onData = (input) => {
      if (sessionId && socketRef.current) {
        socketRef.current.emit(
          'terminal:input',
          { sessionId, input },
          (response) => {
            if (!response.success) {
              term.write(`\r\n❌ Input error: ${response.error}\r\n`);
            }
          }
        );
      }
    };

    term.onData(onData);

    // Setup resize observer for container resizing
    if (terminalRef.current && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        try {
          fitAddonRef.current.fit();
          
          // Send resize to backend
          if (sessionId && socketRef.current) {
            const cols = term.cols;
            const rows = term.rows;
            socketRef.current.emit('terminal:resize', { sessionId, cols, rows });
          }
        } catch (error) {
          console.warn('Resize error:', error);
        }
      });

      resizeObserverRef.current.observe(terminalRef.current);
    }

    // Handle window resize
    const handleWindowResize = () => {
      try {
        fitAddonRef.current.fit();
        
        if (sessionId && socketRef.current) {
          socketRef.current.emit('terminal:resize', {
            sessionId,
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (error) {
        console.warn('Window resize error:', error);
      }
    };

    window.addEventListener('resize', handleWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      // Kill terminal session on unmount
      if (sessionId && socketRef.current) {
        socketRef.current.emit('terminal:kill', { sessionId });
      }

      if (socket) {
        socket.off('terminal:output');
      }

      term.dispose();
    };
  }, [socket, sessionId, user?._id, projectId, workingDir]);

  /**
   * Poll terminal stats periodically
   */
  useEffect(() => {
    if (!sessionId || !socketRef.current) return;

    const interval = setInterval(() => {
      socketRef.current.emit('terminal:stats', { sessionId }, (response) => {
        if (response.success) {
          setSessionStats(response.stats);
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-300 text-sm font-mono">
            {isLoading ? 'Initializing...' : sessionId ? 'Terminal Ready' : 'Disconnected'}
          </span>
        </div>

        {sessionStats && (
          <div className="text-gray-400 text-xs font-mono gap-4 flex">
            <span>Uptime: {Math.floor(sessionStats.uptime / 1000)}s</span>
            <span>Output: {(sessionStats.outputSize / 1024).toFixed(1)}KB</span>
          </div>
        )}
      </div>

      {/* Terminal Container */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden bg-gray-950 relative"
        style={{
          padding: '8px',
          boxSizing: 'border-box',
        }}
      />

      {/* Footer */}
      <div className="bg-gray-800 px-4 py-1 border-t border-gray-700">
        <p className="text-gray-500 text-xs">
          📝 Type commands • ⌨️ Ctrl+C to interrupt • 🔄 Auto-resize on window change
        </p>
      </div>
    </div>
  );
};

export default TerminalComponent;
