import axios from 'axios';
import { getEnv } from '@/helpers/getEnv';

const API_URL = `${getEnv('VITE_API_BASE_URL')}/notifications`;

export async function fetchNotifications() {
  const { data } = await axios.get(API_URL, { withCredentials: true });
  return data.notifications;
}

export async function markNotificationAsRead(id) {
  const { data } = await axios.patch(`${API_URL}/${id}/read`, {}, { withCredentials: true });
  return data;
}

export async function markAllAsRead() {
  const { data } = await axios.patch(`${API_URL}/read-all`, {}, { withCredentials: true });
  return data;
}

export async function deleteNotification(id) {
  const { data } = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
  return data;
}