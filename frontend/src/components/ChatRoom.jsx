import { useEffect, useState, useRef } from "react";
import { socket } from "../api/socket";
import axios from "axios";
import { API_URL } from "../api/config";
import toast from "react-hot-toast";
import "./ChatRoom.css";

export default function ChatRoom({ roomId, pin, nickname, onBack }) {
  const [messages, setMessages] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [participants, setParticipants] = useState([]);
  const [joined, setJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [roomType, setRoomType] = useState("standard");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, messageId: null });
  const [editingMessage, setEditingMessage] = useState({ id: null, content: "" });
  const [isKicked, setIsKicked] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!joined && roomId && pin && nickname) {
      socket.emit("joinRoom", { pin, nickname });
      fetchRoomData();
      fetchHistory();
      setJoined(true);
    }

    // ✅ Enviar ping de actividad cada 2 minutos
    const activityInterval = setInterval(() => {
      if (joined && nickname) {
        socket.emit("userActivity", { nickname });
      }
    }, 2 * 60 * 1000); // 2 minutos

    return () => clearInterval(activityInterval);
  }, [roomId, pin, nickname, joined]);

  // 🔹 Obtener tipo de sala
  const fetchRoomData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const room = res.data;
      console.log("Sala cargada:", room);
      setRoomType(room.type || "standard");
      
      // Verificar si el usuario actual es el creador de la sala
      if (room.createdBy) {
        // Si createdBy es un objeto con username
        if (room.createdBy.username === nickname) {
          setIsAdmin(true);
          console.log("Usuario es admin de la sala");
        }
        // Si createdBy es solo un ID, comparar con el userId guardado
        else if (typeof room.createdBy === 'string') {
          const userId = localStorage.getItem("userId");
          if (userId && room.createdBy === userId) {
            setIsAdmin(true);
            console.log(" Usuario es admin de la sala");
          }
        }
      }
    } catch (err) {
      console.error("Error cargando sala:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/room/${roomId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    }
  };

  // 🔹 Enviar mensaje instantáneo
  const sendMessage = () => {
    if (message.trim() === "" || isKicked) return;

    socket.emit("sendMessage", { roomId, sender: nickname, content: message });
    setMessage("");
  };

  // 🔹 Subir archivo
  const handleFileUpload = async (e) => {
    if (isKicked) {
      toast.error("Has sido expulsado de la sala");
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    
    if (!roomId || !nickname) {
      toast.error("No se ha identificado la sala o el usuario");
      return;
    }

    // Validar que sea sala multimedia
    if (roomType !== "multimedia") {
      toast.error("Esta sala no permite archivos");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);
    formData.append("sender", nickname);

    // Mostrar loading
    toast.loading("Subiendo archivo...", { id: "upload" });

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const { fileUrl, messageId, fileName } = res.data;
      console.log("📎 Archivo subido:", fileUrl);

      // Solo emitir el mensaje - el socket lo agregará a la UI automáticamente
      socket.emit("sendMessage", {
        roomId,
        sender: nickname,
        content: `${API_URL}${fileUrl}`,
        type: "file",
        fileName: fileName || file.name,
        messageId: messageId,
      });

      toast.success("Archivo enviado 🎉", { id: "upload" });
    } catch (err) {
      console.error("Error subiendo archivo:", err);
      const errorMsg = err.response?.data?.message || "Error al subir archivo";
      toast.error(errorMsg, { id: "upload" });
    }

    // Limpiar el input
    e.target.value = "";
  };

  // 🔹 Eliminar mensaje
  const handleDeleteMessage = async (id) => {
    setMessageToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const id = messageToDelete;
    setShowDeleteModal(false);
    setMessageToDelete(null);

    try {
      const token = localStorage.getItem("token");
      
      // Primero actualizar localmente de manera optimista
      setMessages((prev) =>
        prev.map((m) =>
          m._id === id ? { ...m, content: "Mensaje eliminado", type: "deleted" } : m
        )
      );

      // Luego hacer la petición al servidor
      await axios.delete(`${API_URL}/api/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Emitir evento para actualizar a otros usuarios
      socket.emit("deleteMessage", { messageId: id, roomId, nickname, isAdmin });
      toast.success("Mensaje eliminado");
    } catch (err) {
      console.error("Error al eliminar mensaje:", err);
      const errorMsg = err.response?.data?.message || "Error al eliminar mensaje";
      toast.error(errorMsg);
      
      // Si falla, recargar mensajes
      fetchHistory();
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  // Iniciar edición de mensaje
  const handleEditMessage = (msg) => {
    if (msg.type === "file") {
      toast.error("No puedes editar archivos");
      return;
    }
    setEditingMessage({ id: msg._id, content: msg.content });
    closeContextMenu();
  };

  // Guardar mensaje editado
  const saveEditedMessage = async () => {
    if (!editingMessage.content.trim()) {
      toast.error("El mensaje no puede estar vacío");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Actualizar localmente de manera optimista
      setMessages((prev) =>
        prev.map((m) =>
          m._id === editingMessage.id ? { ...m, content: editingMessage.content, edited: true } : m
        )
      );

      // Enviar al servidor
      await axios.put(
        `${API_URL}/api/messages/${editingMessage.id}`,
        { content: editingMessage.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emitir evento para actualizar a otros usuarios
      socket.emit("editMessage", {
        messageId: editingMessage.id,
        roomId,
        newContent: editingMessage.content,
      });

      toast.success("Mensaje editado");
      setEditingMessage({ id: null, content: "" });
    } catch (err) {
      console.error("Error al editar mensaje:", err);
      toast.error("Error al editar mensaje");
      fetchHistory(); // Recargar si falla
    }
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingMessage({ id: null, content: "" });
  };

  // Expulsar usuario (solo admin)
  const handleKickUser = (targetNickname) => {
    if (!isAdmin) {
      toast.error("No tienes permisos para expulsar usuarios");
      return;
    }

    if (window.confirm(`¿Expulsar a ${targetNickname} de la sala?`)) {
      socket.emit("kickUser", { roomId, targetNickname, adminNickname: nickname });
      toast.success(`${targetNickname} ha sido expulsado de la sala`);
    }
  };

  // Manejar click derecho en mensaje
  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    
    // Solo mostrar menú si es tu mensaje o eres admin, y no está eliminado
    if ((msg.sender === nickname || isAdmin) && msg.type !== "deleted") {
      // Dimensiones aproximadas del menú contextual
      const menuWidth = 200;
      const menuHeight = 100; // Altura aproximada con 2 opciones
      
      // Obtener dimensiones de la ventana
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calcular posición X (evitar que se salga por la derecha)
      let x = e.clientX;
      if (x + menuWidth > windowWidth) {
        x = windowWidth - menuWidth - 10; // 10px de margen
      }
      
      // Calcular posición Y (evitar que se salga por abajo)
      let y = e.clientY;
      if (y + menuHeight > windowHeight) {
        y = windowHeight - menuHeight - 10; // 10px de margen
      }
      
      setContextMenu({
        show: true,
        x: x,
        y: y,
        messageId: msg._id,
        message: msg
      });
    }
  };

  // Cerrar menú contextual
  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, messageId: null, message: null });
  };

  // Click en cualquier parte cierra el menú
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu.show) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.show]);

  useEffect(() => {
    socket.on("newMessage", (data) => {
      console.log("🟢 Nuevo mensaje recibido:", data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on("messageDeleted", ({ id, newContent }) => {
      console.log("🗑️ Mensaje eliminado recibido:", { id, newContent });
      console.log("📋 Mensajes actuales:", messages.map(m => ({ id: m._id, content: m.content })));
      setMessages((prev) => {
        const updated = prev.map((m) => {
          if (m._id === id || m._id.toString() === id.toString()) {
            console.log("✅ Encontrado mensaje para actualizar:", m._id);
            return { ...m, content: newContent || "🗑️ Mensaje eliminado", type: "deleted" };
          }
          return m;
        });
        console.log("📋 Mensajes después de actualizar:", updated.map(m => ({ id: m._id, content: m.content, type: m.type })));
        return updated;
      });
    });

    socket.on("messageEdited", ({ id, newContent }) => {
      console.log("Mensaje editado recibido:", { id, newContent });
      setMessages((prev) =>
        prev.map((m) =>
          m._id === id ? { ...m, content: newContent, edited: true } : m
        )
      );
    });

    socket.on("activeUsersUpdate", (list) => setParticipants(list || []));

    socket.on("systemMessage", (msg) => {
      setSystemMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.content === msg.content) return prev;
        return [...prev, msg];
      });
      toast(msg.content, { icon: "" });
    });

    socket.on("kicked", ({ message }) => {
      console.log("🚫 Usuario expulsado:", message);
      setIsKicked(true);
      setDisconnectReason("expulsado");
      
      // Desconectar inmediatamente del socket de la sala
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("messageEdited");
      socket.off("systemMessage");
      socket.off("activeUsersUpdate");
      
      toast.error(message, { duration: 5000 });
      
      // Forzar redirección inmediata
      const timer = setTimeout(() => {
        console.log("⬅️ Redirigiendo al dashboard...");
        onBack();
      }, 3000);
      
      return () => clearTimeout(timer);
    });

    // ✅ Sesión reemplazada por otro dispositivo
    socket.on("sessionReplaced", ({ message }) => {
      console.log("🔄 Sesión reemplazada:", message);
      setIsKicked(true);
      setDisconnectReason("sesión reemplazada");
      toast.error(message, { duration: 5000 });
      setTimeout(() => {
        onBack();
      }, 3000);
    });

    // ✅ Desconexión por inactividad
    socket.on("inactivityDisconnect", ({ message }) => {
      console.log("⏰ Desconexión por inactividad:", message);
      setIsKicked(true);
      setDisconnectReason("inactividad");
      toast.error(message, { duration: 5000 });
      setTimeout(() => {
        onBack();
      }, 3000);
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("messageEdited");
      socket.off("systemMessage");
      socket.off("activeUsersUpdate");
      socket.off("kicked");
      socket.off("sessionReplaced");
      socket.off("inactivityDisconnect");
    };
  }, [onBack]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, systemMessages]);

  const renderContent = (msg) => {
    // Si el mensaje fue eliminado
    if (msg.type === "deleted") {
      return <span className="deleted-message">{msg.content}</span>;
    }

    // Si es archivo
    if (msg.type === "file" || msg.content?.match(/\.(jpg|jpeg|png|gif|mp4|pdf|webm|doc|docx|xls|xlsx|zip|rar)$/i)) {
      const fileName = msg.fileName || msg.content.split('/').pop();
      
      // Imágenes
      if (msg.content.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return (
          <div className="file-message image-message">
            <img src={msg.content} alt={fileName} className="chat-image" />
            <div className="file-name">{fileName}</div>
          </div>
        );
      }
      
      // Videos
      if (msg.content.match(/\.(mp4|webm|mov)$/i)) {
        return (
          <div className="file-message video-message">
            <video controls className="chat-video">
              <source src={msg.content} type="video/mp4" />
            </video>
            <div className="file-name">{fileName}</div>
          </div>
        );
      }
      
      // PDFs
      if (msg.content.match(/\.pdf$/i)) {
        return (
          <a href={msg.content} target="_blank" rel="noopener noreferrer" className="file-message pdf-message">
            <div className="file-icon">📄</div>
            <div className="file-info">
              <div className="file-name">{fileName}</div>
              <div className="file-action">Abrir PDF</div>
            </div>
          </a>
        );
      }
      
      // Otros archivos
      return (
        <a href={msg.content} download target="_blank" rel="noopener noreferrer" className="file-message other-file">
          <div className="file-icon">📎</div>
          <div className="file-info">
            <div className="file-name">{fileName}</div>
            <div className="file-action">Descargar</div>
          </div>
        </a>
      );
    }
    
    // Mensaje de texto normal
    return <span className="text-message">{msg.content}</span>;
  };

  return (
    <div className="chat-container">
      {isKicked && (
        <div className="kicked-overlay">
          <div className="kicked-message">
            {disconnectReason === "expulsado" && (
              <>
                <h2>🚫 Has sido expulsado</h2>
                <p>El administrador te ha expulsado de esta sala</p>
              </>
            )}
            {disconnectReason === "sesión reemplazada" && (
              <>
                <h2>🔄 Sesión reemplazada</h2>
                <p>Tu sesión ha sido reemplazada por otro dispositivo</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Solo puedes estar conectado desde un dispositivo a la vez</p>
              </>
            )}
            {disconnectReason === "inactividad" && (
              <>
                <h2>⏰ Desconectado por inactividad</h2>
                <p>Has estado inactivo por más de 5 minutos</p>
              </>
            )}
            <p>Serás redirigido al inicio...</p>
          </div>
        </div>
      )}
      
      <div className="chat-header">
        <div>
          <h2>{isAdmin ? " Administrador" : "Chat de Sala"}</h2>
          <p>{nickname}</p>
        </div>
        <div className="chat-actions">
          <button className="btn-outline" onClick={() => setShowPanel(!showPanel)}>
            👥 Participantes
          </button>
          <button className="btn-danger" onClick={onBack}>Salir</button>
        </div>
      </div>

      {showPanel && (
        <div className="participants-panel">
          <h3>Participantes ({participants.length})</h3>
          <ul>
            {participants.map((u, i) => (
              <li key={i}>
                <span>●</span> {u.nickname}
                {isAdmin && u.nickname !== nickname && (
                  <button
                    className="kick-btn"
                    onClick={() => handleKickUser(u.nickname)}
                    title="Expulsar usuario"
                  >
                    🚫
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="chat-messages">
        {systemMessages.map((msg, i) => (
          <div key={`sys-${i}`} className="system-message">{msg.content}</div>
        ))}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`message ${msg.sender === nickname ? "sent" : "received"}`}
            onContextMenu={(e) => handleContextMenu(e, msg)}
          >
            <div className="message-content">
              <div className="message-header">
                <strong>{msg.sender}</strong>
                {msg.edited && <span className="edited-badge">editado</span>}
              </div>
              
              {editingMessage.id === msg._id ? (
                <div className="edit-message-box">
                  <input
                    type="text"
                    className="edit-input"
                    value={editingMessage.content}
                    onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditedMessage();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button className="btn-save" onClick={saveEditedMessage}>✓</button>
                    <button className="btn-cancel-edit" onClick={cancelEdit}>✕</button>
                  </div>
                </div>
              ) : (
                <div className="message-body">{renderContent(msg)}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        {!isKicked && roomType === "multimedia" && (
          <label className="file-upload">
            📎
            <input type="file" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        )}
        <input
          className="message-input"
          placeholder={isKicked ? "Has sido expulsado de la sala" : "Escribe un mensaje..."}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            // Actualizar actividad al escribir
            socket.emit("userActivity", { nickname });
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={isKicked}
        />
        <button 
          className="send-button" 
          onClick={sendMessage}
          disabled={isKicked}
        >
          Enviar
        </button>
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar mensaje?</h3>
            <p>Esta acción no se puede deshacer</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelDelete}>Cancelar</button>
              <button className="btn-confirm-delete" onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Menú contextual */}
      {contextMenu.show && (
        <div 
          className="context-menu" 
          style={{ 
            top: `${contextMenu.y}px`, 
            left: `${contextMenu.x}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Solo mostrar editar si es el dueño del mensaje y no es archivo */}
          {contextMenu.message?.sender === nickname && contextMenu.message?.type !== "file" && (
            <div 
              className="context-menu-item"
              onClick={() => {
                handleEditMessage(contextMenu.message);
                closeContextMenu();
              }}
            >
              <span className="context-icon">✏️</span>
              Editar mensaje
            </div>
          )}
          
          <div 
            className="context-menu-item"
            onClick={() => {
              handleDeleteMessage(contextMenu.messageId);
              closeContextMenu();
            }}
          >
            <span className="context-icon">🗑️</span>
            Eliminar mensaje
          </div>
        </div>
      )}
    </div>
  );
}
