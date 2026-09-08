import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
  clearReadNotifications,
} from "./notificationsService";
import { clearAuthSession, getCurrentUserProfile } from "../../services/authService";

const TYPE_CONFIG = {
  FEE_DUE: { label: "Fee Due", icon: "💰", color: "bg-amber-100 text-amber-800 border-amber-200" },
  FEE_PAID: { label: "Fee Paid", icon: "💳", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CLASS_SCHEDULE_CHANGED: { label: "Schedule", icon: "📅", color: "bg-violet-100 text-violet-800 border-violet-200" },
  EXAM_ANNOUNCED: { label: "Exam", icon: "📝", color: "bg-purple-100 text-purple-800 border-purple-200" },
  GRADE_POSTED: { label: "Academics", icon: "📊", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ATTENDANCE_ALERT: { label: "Attendance", icon: "⏱️", color: "bg-rose-100 text-rose-800 border-rose-200" },
  TEACHER_MESSAGE: { label: "Teacher Note", icon: "💬", color: "bg-sky-100 text-sky-800 border-sky-200" },
  SCHOOL_ANNOUNCEMENT: { label: "Announcement", icon: "📢", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  SYSTEM_ALERT: { label: "System", icon: "🛡️", color: "bg-slate-100 text-slate-800 border-slate-200" },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'unread' | 'read'
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");
        const [userData, notifsData] = await Promise.all([
          getCurrentUserProfile().catch(() => null),
          fetchNotifications(),
        ]);
        setCurrentUser(userData);
        setNotifications(notifsData);
      } catch (requestError) {
        if (requestError.status === 401) {
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
        setError(requestError.message || "Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [navigate]);

  // Determine back route based on user role
  const homeRoute = useMemo(() => {
    if (!currentUser) return "/dashboard";
    const roles = currentUser.roles || [];
    if (roles.includes("STUDENT")) return "/student/dashboard";
    if (roles.includes("PARENT")) return "/parent/dashboard";
    if (roles.includes("TEACHER")) return "/teacher/dashboard";
    return "/dashboard";
  }, [currentUser]);

  // Compute live KPI stats
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const urgentCount = notifications.filter(
    (n) => n.priority === "URGENT" || n.priority === "HIGH"
  ).length;
  const readCount = totalCount - unreadCount;

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Status filter
      if (statusFilter === "unread" && n.is_read) return false;
      if (statusFilter === "read" && !n.is_read) return false;

      // Type filter
      if (typeFilter !== "all" && n.notification_type !== typeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (n.title || "").toLowerCase().includes(q);
        const msgMatch = (n.message || "").toLowerCase().includes(q);
        const senderMatch = (n.sender_name || "").toLowerCase().includes(q);
        const studentMatch = (n.related_student_name || "").toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !senderMatch && !studentMatch) return false;
      }

      return true;
    });
  }, [notifications, statusFilter, typeFilter, searchQuery]);

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  async function handleToggleRead(notification) {
    const id = notification.id;
    try {
      setProcessingId(id);
      if (notification.is_read) {
        await markNotificationUnread(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: false, read_at: null } : n))
        );
      } else {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
      }
    } catch (err) {
      setError(err.message || "Failed to update notification state.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      setProcessingId(id);
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Notification deleted.");
    } catch (err) {
      setError(err.message || "Failed to delete notification.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      showToast("All notifications marked as read.");
    } catch (err) {
      setError(err.message || "Failed to mark notifications as read.");
    }
  }

  async function handleClearRead() {
    if (!window.confirm("Are you sure you want to remove all read notifications?")) return;
    try {
      const res = await clearReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      showToast(res?.message || "Read notifications cleared.");
    } catch (err) {
      setError(err.message || "Failed to clear read notifications.");
    }
  }

  function showToast(msg) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(""), 4000);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-md">
            🔔
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">SSMS Notification Center</h1>
            <p className="text-xs text-slate-500">Official Announcements, Alerts & Updates</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={homeRoute}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <span>🏠</span>
            <span>Return to Portal</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 lg:p-8">
        {/* Banner Card */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-sm">
                <span>⚡</span> Real-Time System Updates
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                Notifications & Broadcasts
              </h2>
              <p className="mt-1 text-sm text-blue-100 max-w-xl">
                Stay updated on grade postings, attendance alerts, exam announcements, and school communications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Mark All Read
              </button>
              <button
                type="button"
                onClick={handleClearRead}
                disabled={readCount === 0}
                className="rounded-xl bg-white/20 border border-white/30 px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Clear Read
              </button>
            </div>
          </div>
        </div>

        {/* Live KPI Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4.5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Notices</span>
              <span className="text-base">📋</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{totalCount}</p>
            <p className="mt-0.5 text-xs text-slate-500">In your mailbox</p>
          </div>

          <div className="rounded-2xl bg-white p-4.5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 text-xs font-semibold uppercase tracking-wider">
              <span>Unread</span>
              <span className="text-base">📬</span>
            </div>
            <p className="mt-2 text-2xl font-black text-blue-600">{unreadCount}</p>
            <p className="mt-0.5 text-xs text-slate-500">Awaiting your review</p>
          </div>

          <div className="rounded-2xl bg-white p-4.5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-rose-600 text-xs font-semibold uppercase tracking-wider">
              <span>Urgent / High</span>
              <span className="text-base">🚨</span>
            </div>
            <p className="mt-2 text-2xl font-black text-rose-600">{urgentCount}</p>
            <p className="mt-0.5 text-xs text-slate-500">Priority action required</p>
          </div>

          <div className="rounded-2xl bg-white p-4.5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold uppercase tracking-wider">
              <span>Read / Done</span>
              <span className="text-base">✅</span>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600">{readCount}</p>
            <p className="mt-0.5 text-xs text-slate-500">Completed items</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {actionSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>{actionSuccess}</span>
            </div>
            <button type="button" onClick={() => setActionSuccess("")} className="text-emerald-600 hover:text-emerald-800">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError("")} className="text-rose-600 hover:text-rose-800">
              ✕
            </button>
          </div>
        )}

        {/* Search & Filter Controls Section */}
        <section className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
              {[
                { label: `All (${totalCount})`, value: "all" },
                { label: `Unread (${unreadCount})`, value: "unread" },
                { label: `Read (${readCount})`, value: "read" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    statusFilter === opt.value
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Type Filter & Search Query */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Notification Types</option>
                <option value="GRADE_POSTED">📊 Academics & Grades</option>
                <option value="ATTENDANCE_ALERT">⏱️ Attendance Alerts</option>
                <option value="FEE_DUE">💰 Fee Notices</option>
                <option value="FEE_PAID">💳 Payment Confirmations</option>
                <option value="CLASS_SCHEDULE_CHANGED">📅 Class Schedule Updates</option>
                <option value="EXAM_ANNOUNCED">📝 Exam Announcements</option>
                <option value="TEACHER_MESSAGE">💬 Teacher Notes</option>
                <option value="SCHOOL_ANNOUNCEMENT">📢 School Announcements</option>
                <option value="SYSTEM_ALERT">🛡️ System Alerts</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  🔍
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications List */}
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            <p className="mt-4 text-xs font-medium text-slate-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl mx-auto">
              ✓
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">You're All Caught Up</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              No notifications matching your current filter. When new grades, attendance notices, or announcements are published, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredNotifications.map((notif) => {
              const typeMeta = TYPE_CONFIG[notif.notification_type] || TYPE_CONFIG.SYSTEM_ALERT;
              const isUrgent = notif.priority === "URGENT";
              const isHigh = notif.priority === "HIGH";

              return (
                <article
                  key={notif.id}
                  className={`relative rounded-2xl bg-white p-5 shadow-sm border transition-all duration-150 ${
                    notif.is_read
                      ? "border-slate-200/80 hover:border-slate-300"
                      : "border-blue-300 bg-gradient-to-r from-blue-50/20 via-white to-white shadow-md ring-1 ring-blue-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Unread indicator / Type Icon */}
                      <div className="relative flex-shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl shadow-inner">
                          {typeMeta.icon}
                        </div>
                        {!notif.is_read && (
                          <span
                            className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white"
                            title="Unread notification"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Tags Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${typeMeta.color}`}
                          >
                            <span>{typeMeta.icon}</span>
                            <span>{notif.notification_type_display || typeMeta.label}</span>
                          </span>

                          {isUrgent ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-200 px-2 py-0.5 text-[11px] font-extrabold text-rose-700 animate-pulse">
                              🚨 Urgent
                            </span>
                          ) : isHigh ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                              ⚠️ High Priority
                            </span>
                          ) : null}

                          {notif.related_student_name && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                              👤 {notif.related_student_name}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          className={`text-sm font-bold tracking-tight ${
                            notif.is_read ? "text-slate-800" : "text-slate-950 font-extrabold"
                          }`}
                        >
                          {notif.title}
                        </h3>

                        {/* Message Body */}
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {notif.message}
                        </p>

                        {/* Footer metadata */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 border-t border-slate-100 pt-2.5">
                          <span>🕒 {formatDate(notif.created_at)}</span>
                          {notif.sender_name && (
                            <span>👤 By: {notif.sender_name}</span>
                          )}
                          {notif.is_read && notif.read_at && (
                            <span className="text-slate-400">✓ Read {formatDate(notif.read_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex sm:flex-col items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(notif)}
                        disabled={processingId === notif.id}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          notif.is_read
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                        }`}
                      >
                        {notif.is_read ? "Mark Unread" : "Mark Read"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(notif.id)}
                        disabled={processingId === notif.id}
                        title="Delete notification"
                        className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                      >
                        🗑️
                      </button>
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