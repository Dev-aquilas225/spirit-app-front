import { http, ApiError } from './http.client';

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export const SupportService = {
  async createTicket(data: { subject: string; message: string }): Promise<{ data?: SupportTicket; error?: string }> {
    try {
      const result = await http.post<SupportTicket>('/support/tickets', data);
      return { data: result };
    } catch (e) {
      return { error: (e as ApiError).message };
    }
  },

  async getMyTickets(): Promise<SupportTicket[]> {
    try {
      return await http.get<SupportTicket[]>('/support/tickets/me');
    } catch {
      return [];
    }
  },
};
