import React, { useState } from "react";
import { API_BASE_URL } from "../config";
import "./AiChat.css";

const initialMessage = {
  role: "assistant",
  content: "Ask me about your expenses, summaries, searches, or CRUD actions.",
};

const reportDownloadUrl = (report) => {
  const data = report?.result?.data;
  if (!data?.year) return null;
  const params = new URLSearchParams({ year: String(data.year) });
  if (data.month) params.set("month", String(data.month));
  return `${API_BASE_URL}/download-report?${params.toString()}`;
};

const AiChat = () => {
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingClassification, setPendingClassification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const userMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "AI request failed");

      setMessages((current) => [...current, { role: "assistant", content: result.message, tool_calls: result.tool_calls }]);
      setPendingDelete(result.pending_delete || null);
      setPendingClassification(result.pending_classification || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmClassification = async (reallyNeeded) => {
    if (!pendingClassification) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/confirm-classification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pendingClassification, really_needed: reallyNeeded }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Could not save expense");
      setMessages((current) => [...current, { role: "assistant", content: result.message }]);
      setPendingClassification(null);
      window.dispatchEvent(new Event("expenses:changed"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/confirm-delete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expense_id: pendingDelete.expense_id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Delete failed");
      setMessages((current) => [...current, { role: "assistant", content: result.message }]);
      setPendingDelete(null);
      window.dispatchEvent(new Event("expenses:changed"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-chat">
      <div className="ai-chat__header">
        <div>
          <p className="ai-chat__eyebrow">ExpenseManager</p>
          <h1>Ask AI</h1>
        </div>
        <span className="ai-chat__status">Daily expenses</span>
      </div>

      <div className="ai-chat__messages" aria-live="polite">
        {messages.map((message, index) => (
          <article className={`ai-chat__message ai-chat__message--${message.role}`} key={`${message.role}-${index}`}>
            <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
            <p>{message.content}</p>
            {message.tool_calls?.length > 0 && (
              <details className="ai-chat__tools">
                <summary>Tool activity</summary>
                {message.tool_calls.map((tool, toolIndex) => (
                  <div key={`${tool.name}-${toolIndex}`}>
                    <pre>{tool.name}</pre>
                    {tool.name === "get_expense_report" && reportDownloadUrl(tool) && (
                      <a
                        className="ai-chat__download"
                        href={reportDownloadUrl(tool)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download Excel report
                      </a>
                    )}
                  </div>
                ))}
              </details>
            )}
          </article>
        ))}
        {loading && <p className="ai-chat__loading">Thinking...</p>}
      </div>

      {pendingDelete && (
        <div className="ai-chat__confirm">
          <span>Confirm deletion of expense #{pendingDelete.expense_id}?</span>
          <button type="button" onClick={confirmDelete} disabled={loading}>Delete</button>
          <button type="button" onClick={() => setPendingDelete(null)} disabled={loading}>Cancel</button>
        </div>
      )}

      {pendingClassification && (
        <div className="ai-chat__confirm">
          <span>
            AI suggestion: <strong>{pendingClassification.really_needed ? "Really needed" : "Not really needed"}</strong>.
            <br />{pendingClassification.reason}
          </span>
          <button type="button" onClick={() => confirmClassification(pendingClassification.really_needed)} disabled={loading}>Confirm and save</button>
          <button type="button" onClick={() => confirmClassification(!pendingClassification.really_needed)} disabled={loading}>Save as {pendingClassification.really_needed ? "not needed" : "needed"}</button>
          <button type="button" onClick={() => setPendingClassification(null)} disabled={loading}>Cancel</button>
        </div>
      )}

      {error && <p className="ai-chat__error">{error}</p>}

      <form className="ai-chat__composer" onSubmit={sendMessage}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about your expenses..."
          rows={3}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>Send</button>
      </form>
    </section>
  );
};

export default AiChat;
