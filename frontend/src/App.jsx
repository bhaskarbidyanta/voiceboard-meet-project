import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Meetings from "./pages/Meetings";
import Register from "./pages/Register";
import api from "./services/api";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vb_user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("vb_user", JSON.stringify(user));
    else localStorage.removeItem("vb_user");
  }, [user]);

  // Validate cached user on startup, when user changes, on window focus, and periodically
  useEffect(() => {
    let intervalId;
    let isMounted = true;

    async function validateUser() {
      if (!user) return;
      try {
        await api.get(`/users?email=${encodeURIComponent(user.email)}`);
        // user exists
      } catch (err) {
        if (!isMounted) return;
        if (err.response && err.response.status === 404) {
          console.log("Cached user not found on server — clearing session");
          alert("Your account appears to have been removed. You have been logged out.");
          setUser(null);
          return;
        }
        console.error("Failed to validate cached user", err);
      }
    }

    // Validate now
    validateUser();

    // Re-validate on focus (helps detect remote deletions)
    function onFocus() {
      validateUser();
    }
    window.addEventListener("focus", onFocus);

    // Periodic re-check every 60 seconds
    intervalId = setInterval(() => validateUser().catch(() => {}), 60 * 1000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", onFocus);
      clearInterval(intervalId);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="container">
        <h1>Voiceboard Meet</h1>
        <Login onLogin={setUser} />
        <hr />
        <Register onRegister={setUser} />
      </div>
    );
  }

  return <Meetings user={user} onLogout={() => setUser(null)} />;
}
