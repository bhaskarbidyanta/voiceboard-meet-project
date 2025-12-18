import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Transcripts() {
  const [text, setText] = useState("");
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/api/transcript");
      setTranscripts(res.data || []);
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || e.message || "Failed to load transcripts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!text.trim()) {
      setError("Please paste transcript text before submitting.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/transcript", { text });
      setText("");
      await load();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || e.message || "Failed to submit transcript");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Transcripts</h3>
      <form onSubmit={handleSubmit}>
        <label>Paste transcript</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} />
        <button type="submit" disabled={loading}>Submit</button>
        {error && <div className="error">{error}</div>}
      </form>

      <h4>Saved transcripts</h4>
      {loading && <div>Loading...</div>}
      {!loading && transcripts.length === 0 && <div>No transcripts yet.</div>}
      <ul className="transcript-list">
        {transcripts.map((t) => (
          <li key={t._id} className="transcript">
            <div><strong>Saved:</strong> {new Date(t.createdAt).toLocaleString()}</div>
            <div><strong>Raw:</strong> {t.rawText}</div>
            <div><strong>Structured:</strong></div>
            <pre className="structured">{JSON.stringify(t.structuredData, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
