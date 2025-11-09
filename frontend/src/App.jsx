import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ChatRoom from "./components/ChatRoom";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [view, setView] = useState("login");

  if (view === "register") {
    return (
      <Register
        onRegisterSuccess={(name) => {
          setNickname(name);
          setView("dashboard");
        }}
      />
    );
  }

  if (!nickname) {
    return (
      <Login
        onLogin={(name) => {
          if (name === "register") setView("register");
          else {
            setNickname(name);
            setView("dashboard");
          }
        }}
      />
    );
  }

  if (view === "admin") {
    return <AdminPanel onBack={() => setView("dashboard")} />;
  }

  if (selectedRoom) {
    return (
      <ChatRoom
        roomId={selectedRoom._id}
        pin={selectedRoom.pin}
        nickname={nickname}
        onBack={() => setSelectedRoom(null)}
      />
    );
  }

  return (
    <Dashboard
      nickname={nickname}
      onEnterRoom={(room) => setSelectedRoom(room)}
      onLogout={() => {
        localStorage.removeItem("nickname");
        localStorage.removeItem("token");
        setNickname("");
        setView("login");
      }}
      onOpenAdmin={() => setView("admin")}
    />
  );
}
