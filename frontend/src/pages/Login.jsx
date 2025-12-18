import React, { useState } from "react";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const normalized = email.trim().toLowerCase();
      const res = await api.get(`/users?email=${encodeURIComponent(normalized)}`);
      const user = res.data;
      if (user) return onLogin(user);
      setError("No user found with that email. Please register.");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("No user found with that email. Please register.");
        return;
      }
      setError(err.response?.data?.error || err.message || "Login failed");
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
