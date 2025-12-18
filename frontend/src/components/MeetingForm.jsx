import React, { useState } from "react";

export default function MeetingForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [emails, setEmails] = useState("");
  const [reminders, setReminders] = useState("60");

  async function submit(e) {
    e.preventDefault();
    const participants = emails
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((email) => ({ email }));

    await onCreate({ title, startTime, participants, reminders: reminders.split(",").map(Number) });

    setTitle("");
    setStartTime("");
    setEmails("");
  }

  return (
    <form onSubmit={submit} className="meeting-form">
      <label>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label>Start time (ISO)</label>
      <input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="2025-12-20T10:00:00.000Z" required />

      <label>Participant emails (comma separated)</label>
      <input value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="alice@example.com, bob@example.com" />

      <label>Reminders (minutes before, comma separated)</label>
      <input value={reminders} onChange={(e) => setReminders(e.target.value)} />

      <button type="submit">Create</button>
    </form>
  );
}
