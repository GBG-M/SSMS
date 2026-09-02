import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notificationsService";
import { clearAuthSession } from "../../services/authService";

const categoryStyles = {
  academic: "bg-blue-100 text-blue-700",
  attendance: "bg-amber-100 text-amber-700",
  finance: "bg-emerald-100 text-emerald-700",
  default: "bg-slate-100 text-slate-700",
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNotifications() {
      try {
        setNotifications(await fetchNotifications());
      } catch (requestError) {
        if (requestError.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [navigate]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const visibleNotifications = useMemo(
    () => filter === "unread"
      ? notifications.filter((notification) => !notification.is_read)
      : notifications,
    [filter, notifications]
  );

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function categoryFor(notification) {
    return String(notification.notification_type_display || notification.category || notification.notification_type || "General");
  }

  async function markAsRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((current) => current.map((notification) =>
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function markAllAsRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-slate-500">SSMS</p>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back
        </button>
      </header>

      <main className="mx-auto max-w-5xl p-6 lg:p-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">Your updates</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Stay informed</h2>
            <p className="mt-2 text-slate-500">Important updates from across the school system.</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
            <span className="font-semibold text-slate-900">{unreadCount}</span>
            <span className="ml-1 text-slate-500">unread</span>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        <div className="mt-8 flex gap-2 border-b border-slate-200">
          {[{ label: "All notifications", value: "all" }, { label: "Unread", value: "unread" }].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${filter === option.value ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading && <p className="py-12 text-center text-slate-500">Loading notifications...</p>}
        {!loading && error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Notifications could not be loaded</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}
        {!loading && !error && visibleNotifications.length === 0 && (
          <div className="mt-6 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-3xl">✓</p>
            <h3 className="mt-3 font-semibold text-slate-900">You are all caught up</h3>
            <p className="mt-1 text-sm text-slate-500">There are no notifications in this view.</p>
          </div>
        )}
        {!loading && !error && visibleNotifications.length > 0 && (
          <div className="mt-6 space-y-3">
            {visibleNotifications.map((notification) => {
              const category = categoryFor(notification);
              const categoryKey = category.toLowerCase();
              return (
                <article key={notification.id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${notification.is_read ? "ring-slate-200" : "ring-blue-200"}`}>
                  <div className="flex gap-4">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${notification.is_read ? "bg-slate-300" : "bg-blue-600"}`} aria-label={notification.is_read ? "Read" : "Unread"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row">
                        <h3 className="font-semibold text-slate-900">{notification.title || notification.subject || "Notification"}</h3>
                        <time className="text-xs text-slate-400">{formatDate(notification.created_at || notification.timestamp)}</time>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message || notification.body}</p>
                      <span className={`mt-4 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyles[categoryKey] || categoryStyles.default}`}>{category}</span>
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className="ml-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}