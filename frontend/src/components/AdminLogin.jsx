import { useState } from "react";
import axios from "axios";
import { API_URL } from "../api/config";


export default function AdminLogin({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Registro de nuevo admin
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/admin/register`, form);
      alert("Administrador creado correctamente ✅");
      localStorage.setItem("token", res.data.token);
      onLogin(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Error al registrar admin");
    }
  };

  // 🔹 Inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/admin/login`, {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      onLogin(res.data);
    } catch (error) {
      alert(error.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-300 to-purple-300">
      <div className="bg-white rounded-xl shadow-lg p-8 w-96">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700">
          {isRegister ? "Registrar Administrador" : "Panel de Administración"}
        </h2>

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <input
              type="text"
              name="name"
              placeholder="Nombre completo"
              value={form.name}
              onChange={handleChange}
              className="border p-2 rounded w-full mb-3"
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-3"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            className="border p-2 rounded w-full mb-4"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 w-full rounded hover:bg-blue-700 transition"
          >
            {isRegister ? "Crear cuenta" : "Ingresar"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 hover:underline"
          >
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </div>
    </div>
  );
}
