import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import Icon from "./Icons";

const API_ROOT = `${API_BASE_URL}/api/notifications`;

function NotificationCenter({ role }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ROOT, { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load notifications.");
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
      setIsOpen(false);
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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={`${unreadCount} unread notifications`}
      >
        <Icon name="bell" className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={load}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {error && <p className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40">{error}</p>}
            
            {items.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Icon name="bell" className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">No notifications yet.</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className={`w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 ${
                    item.readAt ? "opacity-75" : "bg-indigo-50/30 dark:bg-indigo-950/30"
                  }`}
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${item.readAt ? "bg-transparent" : "bg-indigo-600"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${item.readAt ? "font-medium text-slate-800" : "font-semibold text-slate-900"} truncate`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
