import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '@/services/notifications';

// Mock getEnv
vi.mock('@/helpers/getEnv', () => ({
  default: vi.fn(() => 'http://localhost:3000'),
  getEnv: vi.fn(() => 'http://localhost:3000')
}));

describe('notifications service', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchNotifications', () => {
    it('fetches notifications successfully', async () => {
      const mockNotifications = [
        { id: 1, message: 'Test notification 1' },
        { id: 2, message: 'Test notification 2' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotifications
      });

      const result = await fetchNotifications();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/notifications',
        expect.objectContaining({
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual(mockNotifications);
    });

    it('handles notifications wrapped in data object', async () => {
      const mockNotifications = [
        { id: 1, message: 'Test notification 1' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notifications: mockNotifications })
      });

      const result = await fetchNotifications();

      expect(result).toEqual(mockNotifications);
    });

    it('returns empty array for invalid response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ someOtherData: 'value' })
      });

      const result = await fetchNotifications();

      expect(result).toEqual([]);
    });

    it('throws error on fetch failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to fetch notifications' })
      });

      await expect(fetchNotifications()).rejects.toThrow('Failed to fetch notifications');
    });

    it('throws error on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchNotifications()).rejects.toThrow('Network error');
    });

    it('handles null response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

      const result = await fetchNotifications();

      expect(result).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    it('marks notification as read successfully', async () => {
      const mockResponse = { success: true, message: 'Notification marked as read' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await markNotificationAsRead('notification123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/notifications/notification123/read',
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('throws error when marking as read fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Notification not found' })
      });

      await expect(markNotificationAsRead('invalid123')).rejects.toThrow('Notification not found');
    });

    it('handles network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(markNotificationAsRead('notification123')).rejects.toThrow('Connection timeout');
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read successfully', async () => {
      const mockResponse = { success: true, message: 'All notifications marked as read' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await markAllAsRead();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/notifications/read-all',
        expect.objectContaining({
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('throws error when marking all as read fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to mark all as read' })
      });

      await expect(markAllAsRead()).rejects.toThrow('Failed to mark all as read');
    });

    it('handles server error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Internal server error'));

      await expect(markAllAsRead()).rejects.toThrow('Internal server error');
    });
  });

  describe('deleteNotification', () => {
    it('deletes notification successfully', async () => {
      const mockResponse = { success: true, message: 'Notification deleted' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await deleteNotification('notification123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/notifications/notification123',
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('throws error when deletion fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to delete notification' })
      });

      await expect(deleteNotification('invalid123')).rejects.toThrow('Failed to delete notification');
    });

    it('handles authorization error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(deleteNotification('notification123')).rejects.toThrow('Unauthorized');
    });

    it('handles network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network disconnected'));

      await expect(deleteNotification('notification123')).rejects.toThrow('Network disconnected');
    });
  });

  describe('edge cases', () => {
    it('handles empty notification ID', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await markNotificationAsRead('');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/notifications//read',
        expect.any(Object)
      );
    });

    it('handles special characters in notification ID', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await deleteNotification('notification-123_abc');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/notifications/notification-123_abc',
        expect.any(Object)
      );
    });

    it('handles response with additional fields', async () => {
      const mockResponse = {
        success: true,
        message: 'Done',
        additionalData: { count: 5 }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await markAllAsRead();

      expect(result).toEqual(mockResponse);
    });

    it('handles response not ok without message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      await expect(fetchNotifications()).rejects.toThrow();
    });

    it('handles JSON parse error gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(fetchNotifications()).rejects.toThrow('Request failed.');
    });

    it('handles successful response with JSON parse error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const result = await fetchNotifications();

      expect(result).toEqual([]);
    });
  });
});
