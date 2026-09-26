import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { Send, X, Sparkles, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setHistoryLoading(true);
      api
        .get("/ai/history")
        .then((r) => setMessages(r.data || []))
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: text });
      setMessages((prev) => [
        ...prev,
        {
          _id: res.data.messageId,
          role: "assistant",
          content: res.data.reply,
          createdAt: res.data.createdAt,
        },
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || "AI failed to respond");
      setMessages((prev) => prev.filter((m) => m._id !== userMsg._id));
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    if (!confirm("Clear chat history?")) return;
    try {
      await api.delete("/ai/history");
      setMessages([]);
      toast.success("Chat cleared");
    } catch (err) {
      toast.error("Failed to clear");
    }
  };

  const suggestions = [
    "What's my GPA?",
    "Show my attendance",
    "What courses am I in?",
    "Do I owe fees?",
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl z-[150] flex items-center justify-center transition-all ${
          open
            ? "bg-slate-700 hover:bg-slate-800"
            : "bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        } text-white`}
        aria-label="AI Assistant"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl z-[150] flex flex-col overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <div>
                <p className="font-semibold text-sm">Hope AI</p>
                <p className="text-[11px] text-blue-100">
                  Ask me about your school data
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="text-blue-100 hover:text-white p-1 rounded"
                title="Clear chat"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {historyLoading ? (
              <div className="text-center text-sm text-slate-400 py-8">
                Loading chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-3">
                  <Sparkles className="text-white" size={20} />
                </div>
                <p className="font-semibold text-slate-800 text-sm">
                  Hi! I'm Hope AI 👋
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Ask me anything about your academics
                </p>
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                        setTimeout(() => {
                          document.getElementById("ai-chat-form")?.requestSubmit();
                        }, 100);
                      }}
                      className="w-full text-left text-xs bg-white hover:bg-blue-50 border border-slate-200 rounded-lg px-3 py-2 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m._id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            id="ai-chat-form"
            onSubmit={send}
            className="border-t border-slate-200 p-3 flex gap-2 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl px-4 flex items-center justify-center transition"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}