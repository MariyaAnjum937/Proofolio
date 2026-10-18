import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_ROOT = "http://localhost:3000/api/notifications";

function NotificationCenter({ role }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const container = useRef(null);

  const load = async () => {
    const response = await fetch(API_ROOT, { credentials: "include" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load notifications.");
    setItems(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
  };

  useEffect(() => {
    load().catch((requestError) => setError(requestError.message));
  }, []);

  const openNotification = async (notification) => {
    setError("");
    try {
      if (!notification.readAt) {
        const response = await fetch(`${API_ROOT}/${notification._id}/read`, {
          method: "PATCH",
          credentials: "include"
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to mark notification as read.");
      }
      await load();
      if (container.current) container.current.open = false;
      if (role === "faculty") {
        navigate(notification.session ? `/faculty/mentoring/sessions/${notification.session}` : "/faculty/mentoring");
      } else {
        navigate("/mentoring");
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <details className="notification-center" ref={container}>
      <summary aria-label={`${unreadCount} unread notifications`}>
        🔔 {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </summary>
      <div className="notification-panel">
        {error && <p className="message error-message">{error}</p>}
        {items.length === 0 ? <p>No notifications yet.</p> : items.map((item) => (
          <button
            className={`notification-item${item.readAt ? "" : " unread"}`}
            key={item._id}
            type="button"
            onClick={() => openNotification(item)}
          >
            <strong>{item.title}</strong>
            <span>{item.message}</span>
            <small>{new Date(item.createdAt).toLocaleString()}</small>
          </button>
        ))}
      </div>
    </details>
  );
}

export default NotificationCenter;
