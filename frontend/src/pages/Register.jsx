import React, { useState } from "react";
import api from "../services/api";

export default function Register({ onRegister }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Check if user exists first
      try {
        await api.get(`/users?email=${encodeURIComponent(normalizedEmail)}`);
        setError("User already exists — please login");
        return;
      } catch (checkErr) {
        if (checkErr.response && checkErr.response.status !== 404) {
          setError(checkErr.response?.data?.error || "Error checking user");
          return;
        }
        // not found -> proceed to create
      }

      const res = await api.post("/users", { name, email: normalizedEmail, role });
      onRegister(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Registration failed");
    }
  }

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>
        <button type="submit">Register</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
