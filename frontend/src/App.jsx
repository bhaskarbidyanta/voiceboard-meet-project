import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Meetings from "./pages/Meetings";
import Register from "./pages/Register";

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
