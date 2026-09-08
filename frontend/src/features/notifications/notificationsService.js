import { getToken } from "../../services/authService";

const API_URL = "/api/notifications/";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Token ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.detail || data?.error || "Notification request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function fetchNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.is_read !== undefined && params.is_read !== null) {
    query.append("is_read", params.is_read);
  }
  if (params.notification_type) {
    query.append("notification_type", params.notification_type);
  }
  if (params.priority) {
    query.append("priority", params.priority);
  }
  if (params.search) {
    query.append("search", params.search);
  }

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const data = await request(`${API_URL}${queryString}`);
  return Array.isArray(data) ? data : data.results || [];
}

export async function getUnreadCount() {
  try {
    const data = await request(`${API_URL}unread-count/`);
    return data?.unread_count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id) {
  return request(`${API_URL}${id}/mark-read/`, { method: "POST" });
}

export async function markNotificationUnread(id) {
  return request(`${API_URL}${id}/mark-unread/`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  return request(`${API_URL}mark-all-read/`, { method: "POST" });
}

export async function deleteNotification(id) {
  return request(`${API_URL}${id}/`, { method: "DELETE" });
}

export async function clearReadNotifications() {
  return request(`${API_URL}clear-read/`, { method: "POST" });
}