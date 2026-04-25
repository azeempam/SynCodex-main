import { MonitorSmartphone, TerminalSquare } from "lucide-react";

export default function EditorFooterBar({
  isTerminalOpen,
  isMoodAssistantOpen,
  onToggleTerminal,
  onToggleMoodAssistant,
}) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-8 bg-slate-900 border-t border-slate-700 z-50 flex items-center justify-between px-3">
      <div className="text-[11px] text-slate-400">SynCodex IDE</div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleTerminal}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
            isTerminalOpen
              ? "bg-slate-700 text-slate-100"
              : "text-slate-300 hover:bg-slate-800"
          }`}
          title={isTerminalOpen ? "Hide Terminal" : "Show Terminal"}
          aria-label={isTerminalOpen ? "Hide Terminal" : "Show Terminal"}
        >
          <TerminalSquare size={14} />
          <span>Terminal</span>
        </button>

        <button
          type="button"
          onClick={onToggleMoodAssistant}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
            isMoodAssistantOpen
              ? "bg-slate-700 text-slate-100"
              : "text-slate-300 hover:bg-slate-800"
          }`}
          title={isMoodAssistantOpen ? "Hide Mood Assistant" : "Show Mood Assistant"}
          aria-label={isMoodAssistantOpen ? "Hide Mood Assistant" : "Show Mood Assistant"}
        >
          <MonitorSmartphone size={14} />
          <span>Mood Assistant</span>
        </button>
      </div>
    </footer>
  );
}
