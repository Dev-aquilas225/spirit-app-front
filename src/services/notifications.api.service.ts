import { http, ApiError } from './http.client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'prayer' | 'consultation' | 'subscription' | 'formation' | 'system';
  isRead: boolean;
  data?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const NotificationsApiService = {
  async getMine(): Promise<NotificationsResponse> {
    try {
      return await http.get<NotificationsResponse>('/notifications');
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  },

  async markAsRead(id: string): Promise<{ error?: string }> {
    try {
      await http.patch(`/notifications/${id}/read`);
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async markAllAsRead(): Promise<{ error?: string }> {
    try {
      await http.patch('/notifications/read-all');
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async delete(id: string): Promise<{ error?: string }> {
    try {
      await http.delete(`/notifications/${id}`);
      return {};
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },
};
