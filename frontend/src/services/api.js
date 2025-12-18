import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" }
});

export default client;
