import { useState } from "react";
import axios from "axios";
import { API_URL } from "../api/config";
import toast from "react-hot-toast";

export default function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        identifier,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("nickname", res.data.username);
      toast.success(`Bienvenido ${res.data.username}! 👋`);
      onLogin(res.data.username);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🔐 Iniciar sesión</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Correo o usuario"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
        <p>
          ¿No tienes cuenta?{" "}
          <a href="#" onClick={() => onLogin("register")}>
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}
