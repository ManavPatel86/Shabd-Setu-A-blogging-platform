import { getEnv } from '@/helpers/getEnv';

const API_URL = `${getEnv('VITE_API_BASE_URL')}/notifications`;

async function request(url, options = {}) {
  const { body, headers, ...rest } = options;

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Request failed.';
    throw new Error(message);
  }

  return data;
}

export async function fetchNotifications() {
  const data = await request(API_URL, { method: 'GET' });

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.notifications)) {
    return data.notifications;
  }

  return [];
}

export async function markNotificationAsRead(id) {
  return request(`${API_URL}/${id}/read`, { method: 'PATCH', body: {} });
}

export async function markAllAsRead() {
  return request(`${API_URL}/read-all`, { method: 'PATCH', body: {} });
}

export async function deleteNotification(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}
