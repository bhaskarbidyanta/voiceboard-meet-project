import React, { useEffect, useState } from "react";
import api from "../services/api";
import MeetingForm from "../components/MeetingForm";

export default function Meetings({ user, onLogout }) {
  const [meetings, setMeetings] = useState([]);

  async function load() {
    const res = await api.get("/api/meetings");
    setMeetings(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(meetingPayload) {
    const payload = { ...meetingPayload, organizerId: user._id };
    await api.post("/api/meetings", payload);
    load();
  }

  async function respond(meetingId, status) {
    await api.post(`/api/meetings/${meetingId}/respond`, { email: user.email, status });
    load();
  }

  async function notify(meetingId) {
    await api.post(`/api/meetings/${meetingId}/notify`);
    alert("Manual reminders triggered");
  }

  return (
    <div className="container">
      <h2>Welcome, {user.name}</h2>
      <button onClick={onLogout}>Logout</button>

      <h3>Create Meeting</h3>
      <MeetingForm onCreate={handleCreate} />

      <h3>Meetings</h3>
      <button onClick={load}>Refresh</button>
      <ul className="meetings">
        {meetings.map((m) => (
          <li key={m._id} className="meeting">
            <strong>{m.title}</strong>
            <div>Starts: {new Date(m.startTime).toLocaleString()}</div>
            <div>Participants: {m.participants.map((p) => p.email).join(", ")}</div>
            <div>Status: {m.status}</div>
            <div>
              <button onClick={() => respond(m._id, "accepted")}>Accept</button>
              <button onClick={() => respond(m._id, "declined")}>Decline</button>
              <button onClick={() => notify(m._id)}>Send Reminder</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
