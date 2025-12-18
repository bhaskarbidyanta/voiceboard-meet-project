import React, { useState } from "react";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const users = (await api.get("/users")).data;
      const user = users.find((u) => u.email === email);
      if (user) return onLogin(user);
      setError("No user found with that email. Please register.");
    } catch (err) {
      setError(err.message || "Login failed");
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
