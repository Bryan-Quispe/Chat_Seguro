import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api/config";
import toast from "react-hot-toast";
import "./AdminPanel.css";

export default function AdminPanel({ onBack }) {
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState({ name: "", type: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", type: "texto", pin: "" });
  const [loadingCreate, setLoadingCreate] = useState(false);

  // 🔹 Cargar salas desde el backend
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("📡 Obteniendo salas...");
      const res = await axios.get(`${API_URL}/api/admin/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Salas obtenidas:", res.data);
      setRooms(res.data);
    } catch (err) {
      console.error("❌ Error al obtener salas:", err.response?.data || err);
      toast.error("Error al obtener las salas");
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 🔹 Editar
  const handleEdit = (room) => {
    console.log("✏️ Editando sala:", room);
    setEditingRoom(room);
    setForm({ name: room.name, type: room.type });
  };

  // 🔹 Actualizar
  const handleUpdate = async () => {
    if (!editingRoom) return;
    if (!form.name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("📤 Actualizando sala:", editingRoom._id, form);

      const response = await axios.put(
        `${API_URL}/api/admin/rooms/${editingRoom._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Respuesta actualización:", response.data);
      toast.success("Sala actualizada correctamente");
      setEditingRoom(null);
      fetchRooms();
    } catch (err) {
      console.error("❌ Error al actualizar:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Error al actualizar sala");
    }
  };

  // 🔹 Preparar eliminación
  const handleDelete = (id) => {
    console.log("🗑️ Preparando eliminación de sala:", id);
    setRoomToDelete(id);
    setShowDeleteModal(true);
  };

  // 🔹 Confirmar eliminación
  const confirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      const token = localStorage.getItem("token");
      console.log("🚨 Eliminando sala:", roomToDelete);

      const response = await axios.delete(
        `${API_URL}/api/admin/rooms/${roomToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Respuesta eliminación:", response.data);
      toast.success("Sala eliminada correctamente");
      setShowDeleteModal(false);
      setRoomToDelete(null);
      fetchRooms();
    } catch (err) {
      console.error("❌ Error al eliminar:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Error al eliminar sala");
    }
  };

  // 🏗️ Crear nueva sala
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) {
      toast.error("Ingresa un nombre para la sala");
      return;
    }
    
    // Validar PIN antes de enviar
    if (newRoom.pin && newRoom.pin.trim()) {
      if (newRoom.pin.length !== 4) {
        toast.error("El PIN debe tener exactamente 4 dígitos");
        return;
      }
      if (!/^\d+$/.test(newRoom.pin)) {
        toast.error("El PIN solo puede contener números");
        return;
      }
    }
    
    setLoadingCreate(true);
    try {
      const token = localStorage.getItem("token");
      // Si el PIN está vacío, no lo enviamos
      const roomData = { 
        name: newRoom.name, 
        type: newRoom.type 
      };
      if (newRoom.pin && newRoom.pin.trim()) {
        roomData.pin = newRoom.pin;
      }
      await axios.post(`${API_URL}/api/rooms`, roomData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Sala creada correctamente");
      setNewRoom({ name: "", type: "texto", pin: "" });
      setShowCreateForm(false);
      fetchRooms();
    } catch (err) {
      // Mostrar errores de validación específicos del backend
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach(error => {
          toast.error(error.message);
        });
      } else {
        toast.error(err.response?.data?.message || "Error al crear sala");
      }
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2>Mis Salas Administradas</h2>
        <div className="header-actions">
          <button 
            className="create-button" 
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "✕ Cerrar" : "➕ Nueva Sala"}
          </button>
          <button className="back-button" onClick={onBack}>
            ← Volver
          </button>
        </div>
      </header>

      <div className="admin-content">
        {/* Formulario de Creación */}
        {showCreateForm && (
          <div className="create-form-section">
            <h3>🏗️ Crear Nueva Sala</h3>
            <form onSubmit={handleCreateRoom} className="create-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Nombre de la sala"
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
                  }
                  required
                />
                <select
                  value={newRoom.type}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, type: e.target.value })
                  }
                >
                  <option value="texto">Texto</option>
                  <option value="multimedia">Multimedia</option>
                </select>
                <input
                  type="text"
                  placeholder="PIN (opcional)"
                  value={newRoom.pin}
                  onChange={(e) => setNewRoom({ ...newRoom, pin: e.target.value })}
                  maxLength="4"
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loadingCreate} className="save-btn">
                  {loadingCreate ? "Creando..." : "✓ Crear Sala"}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewRoom({ name: "", type: "texto", pin: "" });
                  }}
                  className="cancel-btn"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {editingRoom ? (
          <div className="edit-form">
            <h3>✏️ Editar Sala</h3>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre de la sala"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="texto">Texto</option>
              <option value="multimedia">Multimedia</option>
            </select>
            <div className="buttons">
              <button className="save-btn" onClick={handleUpdate}>
                💾 Guardar
              </button>
              <button
                className="cancel-btn"
                onClick={() => setEditingRoom(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="rooms-list">
            {rooms.length === 0 ? (
              <div className="empty-state">
                <p>No has creado ninguna sala todavía.</p>
                <p className="hint">👆 Usa el botón "➕ Nueva Sala" para crear tu primera sala</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div key={room._id} className="room-card">
                  <div className="room-info">
                    <h3>{room.name}</h3>
                    <p className="room-type">{room.type}</p>
                    <small className="room-pin">PIN: {room.pin}</small>
                  </div>
                  <div className="actions">
                    <button
                      className="icon-btn edit"
                      onClick={() => {
                        console.log("CLICK EN EDITAR", room);
                        handleEdit(room);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => {
                        console.log("CLICK EN ELIMINAR", room._id);
                        handleDelete(room._id);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>¿Eliminar sala?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={confirmDelete}>
                Eliminar
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
