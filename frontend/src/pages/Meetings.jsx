import React, { useEffect, useState } from "react";
import api from "../services/api";
import MeetingForm from "../components/MeetingForm";
import { io } from "socket.io-client";
import Transcripts from "./Transcripts";

export default function Meetings({ user, onLogout }) {
  const [meetings, setMeetings] = useState([]);

  async function load() {
    const res = await api.get("/api/meetings");
    setMeetings(res.data);
  }

  useEffect(() => {
    load();

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
    socket.on("connect", () => console.log("socket connected", socket.id));

    socket.on("meeting:created", (m) => {
      setMeetings((prev) => [m, ...prev]);
    });
    socket.on("meeting:updated", (m) => {
      setMeetings((prev) => prev.map((x) => (x._id === m._id ? m : x)));
    });
    socket.on("meeting:response", ({ meetingId, participant }) => {
      setMeetings((prev) => prev.map((m) => {
        if (m._id !== meetingId) return m;
        const pIndex = m.participants.findIndex((p) => String(p.email || p.user) === String(participant.email || participant.user));
        if (pIndex !== -1) m.participants[pIndex] = participant;
        return { ...m };
      }));
    });
    socket.on("meeting:reminder", ({ meetingId, email, minutesBefore }) => {
      console.log(`Reminder sent ${minutesBefore}m for ${meetingId} -> ${email}`);
    });

    return () => socket.close();
  }, []);

  async function handleCreate(meetingPayload) {
    const payload = { ...meetingPayload, organizerId: user._id };
    try {
      const res = await api.post("/api/meetings", payload);
      const { meeting, inviteResults } = res.data;
      load();
      // Build a user-friendly message
      const invited = inviteResults.filter((r) => r.invited).map((r) => r.email);
      const skipped = inviteResults.filter((r) => !r.invited).map((r) => `${r.email} (${r.reason})`);
      const msg = `Meeting created: ${meeting.title}. Invited: ${invited.join(", ") || "(none)"}. Skipped: ${skipped.join(", ") || "(none)"}`;
      alert(msg);
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Create meeting failed");
    }
  }

  async function respond(meetingId, status) {
    await api.post(`/api/meetings/${meetingId}/respond`, { email: user.email, status });
    load();
  }

  async function notify(meetingId) {
    await api.post(`/api/meetings/${meetingId}/notify`);
    alert("Manual reminders triggered");
  }

  const [view, setView] = React.useState("meetings");

  return (
    <div className="container">
      <div className="header">
        <div>
          <h2>Welcome, {user.name}</h2>
          <button onClick={onLogout}>Logout</button>
        </div>
        <div className="user-details">
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Role:</strong> {user.role}</div>
          <div><strong>Verified:</strong> {user.verified ? "Yes" : "No"}</div>
          <div><strong>Office Email:</strong> {user.officeEmail || "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <button onClick={() => setView("meetings")} disabled={view === "meetings"}>Meetings</button>
        <button onClick={() => setView("transcripts")} disabled={view === "transcripts"} style={{ marginLeft: 8 }}>Transcripts</button>
      </div>

      {view === "meetings" && (
        <>
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
        </>
      )}

      {view === "transcripts" && (
        <Transcripts />
      )}
    </div>
  );
}
