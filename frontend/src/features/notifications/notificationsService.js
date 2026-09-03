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
    const error = new Error(data?.error?.message || data?.detail || "Notification request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function fetchNotifications() {
  const data = await request(API_URL);
  return Array.isArray(data) ? data : data.results || [];
}

export async function markNotificationRead(id) {
  return request(`${API_URL}${id}/mark-read/`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  return request(`${API_URL}mark-all-read/`, { method: "POST" });
}