import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';
import { useUser } from '../../context/UserContext';
import { X, Trash2 } from 'lucide-react';

const SOCKET_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TerminalComponent = ({ projectId, output = '', isRunning = false, onClose }) => {
  const terminalRef = useRef(null);
  const xTermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const sessionIdRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const [sessionId, setSessionId] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [sessionStats, setSessionStats] = useState(null);
  const [activeTab, setActiveTab] = useState('terminal');
  const [outputText, setOutputText] = useState('');
  const [problemText, setProblemText] = useState('');

  const { userName } = useUser();
  const sessionUserId = userName || localStorage.getItem('email') || 'anonymous';

  const problemSummary = useMemo(() => {
    if (!problemText.trim()) {
      return 'No problems detected.';
    }
    return problemText;
  }, [problemText]);

  useEffect(() => {
    const text = output || '';
    setOutputText(text);

    const problemLines = text
      .split('\n')
      .filter((line) => /(error|exception|failed|traceback)/i.test(line.trim()));
    setProblemText(problemLines.join('\n'));
  }, [output]);

  const clearPane = () => {
    if (xTermRef.current) {
      xTermRef.current.clear();
      xTermRef.current.write('\x1bc');
    }
    setOutputText('');
    setProblemText('');
  };

  useEffect(() => {
    if (!terminalRef.current || !projectId) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;
    setConnectionState('connecting');

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#e0e0e0',
        cursor: '#00d4ff',
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;

    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(terminalRef.current);
    xTermRef.current = term;

    const fitTerminal = () => {
      try {
        fitAddon.fit();
        if (sessionIdRef.current && socketRef.current) {
          socketRef.current.emit('terminal:resize', {
            sessionId: sessionIdRef.current,
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (error) {
        console.warn('Terminal fit failed:', error);
      }
    };

    setTimeout(fitTerminal, 50);

    const handleConnect = () => {
      setConnectionState('connecting');
      socket.emit(
        'terminal:create',
        {
          userId: sessionUserId,
          projectId,
        },
        (response) => {
          if (!response?.success) {
            term.write(`\r\n❌ Error: ${response?.error || 'Unable to create terminal session'}\r\n`);
            setConnectionState('disconnected');
            return;
          }

          sessionIdRef.current = response.sessionId;
          setSessionId(response.sessionId);
          setSessionStats(response.stats || null);
          setConnectionState('connected');
          term.focus();
          fitTerminal();
        }
      );
    };

    const handleDisconnect = () => {
      setConnectionState('disconnected');
    };

    const handleConnectError = () => {
      setConnectionState('disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    const handleTerminalOutput = ({ sessionId: incomingSessionId, data }) => {
      if (incomingSessionId !== sessionIdRef.current) {
        return;
      }
      term.write(data);
    };

    socket.on('terminal.output', handleTerminalOutput);

    const inputDisposable = term.onData((keystroke) => {
      if (!sessionIdRef.current || !socketRef.current) {
        return;
      }

      socketRef.current.emit(
        'terminal.keystroke',
        { sessionId: sessionIdRef.current, keystroke },
        (response = { success: true }) => {
          if (!response.success) {
            term.write(`\r\n❌ Input error: ${response.error}\r\n`);
          }
        }
      );
    });

    const handleWindowResize = () => fitTerminal();
    window.addEventListener('resize', handleWindowResize);

    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => fitTerminal());
      resizeObserverRef.current.observe(terminalRef.current);
    }

    const emitTerminalClose = () => {
      if (sessionIdRef.current && socketRef.current) {
        socketRef.current.emit('terminal:close', { sessionId: sessionIdRef.current });
      }
    };

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      inputDisposable.dispose();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('terminal.output', handleTerminalOutput);

      emitTerminalClose();

      socket.disconnect();

      sessionIdRef.current = null;
      term.dispose();
      setConnectionState('disconnected');
    };
  }, [sessionUserId, projectId]);

  const handleClose = () => {
    if (sessionIdRef.current && socketRef.current) {
      socketRef.current.emit('terminal:close', { sessionId: sessionIdRef.current }, () => {
        sessionIdRef.current = null;
        setSessionId(null);
        setConnectionState('disconnected');
        if (typeof onClose === 'function') {
          onClose();
        }
      });
      return;
    }

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  useEffect(() => {
    if (!sessionId || !socketRef.current) {
      return;
    }

    const interval = setInterval(() => {
      socketRef.current.emit('terminal:stats', { sessionId }, (response) => {
        if (response?.success) {
          setSessionStats(response.stats);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden rounded-lg border border-[#2a2d2e] bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-[#2a2d2e] bg-[#252526] px-3 py-2">
        <div className="flex items-center gap-1">
          {['terminal', 'output', 'problems'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
                activeTab === tab
                  ? 'bg-[#0e639c] text-white'
                  : 'text-gray-300 hover:bg-[#333333]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {sessionStats && (
            <span className="hidden text-xs text-gray-400 md:inline">
              Uptime {Math.floor(sessionStats.uptime / 1000)}s
            </span>
          )}
          {isRunning && (
            <span className="text-xs text-blue-300">Running...</span>
          )}
          <button
            type="button"
            onClick={clearPane}
            className="inline-flex items-center gap-1 rounded bg-[#333333] px-2 py-1 text-xs text-gray-200 hover:bg-[#3d3d3d]"
          >
            <Trash2 size={14} />
            Clear
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1 rounded bg-[#333333] px-2 py-1 text-xs text-gray-200 hover:bg-[#3d3d3d]"
          >
            <X size={14} />
            Close
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {activeTab === 'terminal' && (
          <div
            ref={terminalRef}
            className="h-full overflow-hidden bg-[#1e1e1e] p-2"
            style={{ boxSizing: 'border-box' }}
          />
        )}

        {activeTab === 'output' && (
          <div className="h-full overflow-auto bg-[#1e1e1e] p-3 font-mono text-sm text-gray-200">
            <pre className="whitespace-pre-wrap wrap-break-word">{outputText || '// No output yet'}</pre>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="h-full overflow-auto bg-[#1e1e1e] p-3 font-mono text-sm text-red-300">
            <pre className="whitespace-pre-wrap wrap-break-word">{problemSummary}</pre>
          </div>
        )}

        {connectionState !== 'connected' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55">
            <span className="rounded border border-[#3c3c3c] bg-[#1f1f1f] px-4 py-2 text-sm text-gray-200">
              {connectionState === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalComponent;
